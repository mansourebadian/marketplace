import { randomBytes, randomInt, createHash } from 'node:crypto';
import { availableParallelism, freemem, totalmem } from 'node:os';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { otpDigest, verifyPhoneCode } from '../src/lib/phone-otp';

async function main() {
config({ path: ['.env.local', '.env'], quiet: true });
const args = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const mode = args.mode ?? 'swapped';
const count = Number(args.count ?? 2000);
const concurrency = Number(args.concurrency ?? 16);
const origin = 'http://localhost:3000';
if (!['swapped', 'http'].includes(mode) || !Number.isInteger(count) || count < 2 || count % 2 || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 1000) throw new Error('Use --mode=swapped|http --count=<positive even count> --concurrency=1..1000. Million-user tests require a dedicated distributed load generator.');
if (!/^sqlserver:\/\/(localhost|127\.0\.0\.1|\.)([:;\\]|$)/i.test(process.env.DATABASE_URL ?? '')) throw new Error('This harness is restricted to the local test database.');
if (!process.env.AUTH_SECRET) throw new Error('AUTH_SECRET is required');

const db = new PrismaClient();
const runId = randomBytes(10).toString('hex');
const marker = `otp-load-${runId}`;
const phonePrefix = `+999${BigInt(`0x${runId}`).toString().slice(0, 15)}`;
const report = {
  runId, startedAt: new Date().toISOString(), mode, requested: count, configuredConcurrency: concurrency,
  scope: mode === 'swapped' ? 'Production verifyPhoneCode with real SQL Server transactions; no HTTP, SMS, or sending limits. Distinct codes swapped between pairs.' : 'Real HTTP server-action login with independent synthetic challenges; no SMS or code-issuance step.',
  machine: { logicalCpus: availableParallelism(), memoryGiB: totalmem() / 2 ** 30, freeMemoryGiBAtStart: freemem() / 2 ** 30, node: process.version },
  completed: 0, expectedRejections: 0, authenticated: 0, wrongResult: 0, exceptions: 0,
  peakInFlight: 0, sessionRows: 0, userRows: 0, persistedAttemptRows: 0,
  durationSeconds: 0, requestsPerSecond: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0,
  exceptionCodes: {} as Record<string, number>, outcome: 'running', cleanedUp: false,
  verifierSha256: createHash('sha256').update(await readFile('src/lib/phone-otp.ts')).digest('hex'),
};
const histogram = new Uint32Array(60_001);
let inFlight = 0;
let nextProgress = 0;
const started = performance.now();
const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let actionFields: Array<[string, string]> = [];

async function save() {
  report.durationSeconds = (performance.now() - started) / 1000;
  report.requestsPerSecond = report.completed / report.durationSeconds;
  const percentile = (fraction: number) => {
    let cumulative = 0;
    for (let index = 0; index < histogram.length; index++) {
      cumulative += histogram[index];
      if (cumulative >= Math.ceil(report.completed * fraction)) return index;
    }
    return 0;
  };
  report.p50Ms = percentile(0.5); report.p95Ms = percentile(0.95); report.p99Ms = percentile(0.99);
  await mkdir('reports', { recursive: true });
  await writeFile(`reports/${marker}.json`, JSON.stringify(report, null, 2));
}

try {
  const batchSize = mode === 'http' ? Math.max(2, concurrency * 2) : Math.min(1000, Math.max(2, concurrency * 32));
  for (let offset = 0; offset < count; offset += batchSize) {
    const size = Math.min(batchSize, count - offset);
    const now = new Date();
    const codes = Array.from({ length: size }, () => randomInt(0, 1_000_000).toString().padStart(6, '0'));
    for (let i = 0; i < size; i += 2) if (codes[i] === codes[i + 1]) codes[i + 1] = String((Number(codes[i]) + 1) % 1_000_000).padStart(6, '0');
    const rows = codes.map((code, index) => {
      const id = `${marker}-${offset + index}`;
      return { id, phone: `${phonePrefix}${String(offset + index).padStart(7, '0')}`, codeHash: otpDigest(id, code), requestKey: marker, flow: 'business', callbackUrl: '/profile', delivered: true, createdAt: now, expiresAt: new Date(now.getTime() + 300_000) };
    });
    await db.phoneChallenge.createMany({ data: rows });
    if (mode === 'http' && actionFields.length === 0) {
      const response = await fetch(`${origin}/auth/phone`, { headers: { cookie: `fresha-phone-challenge=${rows[0].id}` }, signal: AbortSignal.timeout(30_000) });
      if (response.status !== 200) throw new Error('Could not load the real OTP form');
      const html = await response.text();
      actionFields = [...html.matchAll(/<input\b[^>]*>/g)].flatMap(match => {
        const name = match[0].match(/name="([^"]*)"/)?.[1];
        return name?.startsWith('$ACTION') ? [[decode(name), decode(match[0].match(/value="([^"]*)"/)?.[1] ?? '')] as [string, string]] : [];
      });
      if (!actionFields.length) throw new Error('Missing server action fields');
    }
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, size) }, async () => {
      while (next < size) {
        const index = next++;
        const tick = performance.now();
        inFlight++;
        report.peakInFlight = Math.max(report.peakInFlight, inFlight);
        try {
          if (mode === 'swapped') {
            const result = await verifyPhoneCode(db, rows[index].id, codes[index ^ 1]);
            if ('sessionToken' in result) report.authenticated++;
            else if (result.error === 'کد تأیید نادرست است. دوباره تلاش کنید.') report.expectedRejections++;
            else report.wrongResult++;
          } else {
            const data = new FormData();
            for (const [name, value] of actionFields) data.set(name, value);
            data.set('code', codes[index]);
            const response = await fetch(`${origin}/auth/phone`, { method: 'POST', headers: { origin, cookie: `fresha-phone-challenge=${rows[index].id}` }, body: data, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
            if (response.status === 303 && response.headers.get('location') === '/auth/business/complete' && response.headers.getSetCookie().some(cookie => /authjs\.session-token=/.test(cookie))) report.authenticated++;
            else { report.wrongResult++; report.exceptionCodes[`HTTP_${response.status}`] = (report.exceptionCodes[`HTTP_${response.status}`] ?? 0) + 1; }
            await response.arrayBuffer();
          }
        } catch (error) {
          report.exceptions++;
          const key = error && typeof error === 'object' && 'code' in error ? String(error.code) : error instanceof Error ? error.name : 'unknown';
          report.exceptionCodes[key] = (report.exceptionCodes[key] ?? 0) + 1;
        } finally {
          const elapsed = performance.now() - tick;
          report.maxMs = Math.max(report.maxMs, elapsed);
          histogram[Math.min(60_000, Math.ceil(elapsed))]++;
          report.completed++; inFlight--;
        }
      }
    }));
    report.persistedAttemptRows += await db.phoneChallenge.count({ where: { requestKey: marker, attempts: 1 } });
    report.userRows += await db.user.count({ where: { phone: { startsWith: phonePrefix } } });
    report.sessionRows += await db.session.count({ where: { user: { phone: { startsWith: phonePrefix } } } });
    await db.phoneChallenge.deleteMany({ where: { requestKey: marker } });
    await db.user.deleteMany({ where: { phone: { startsWith: phonePrefix }, email: { endsWith: '@phone.invalid' } } });
    if (performance.now() >= nextProgress) {
      await save();
      console.log(JSON.stringify({ mode, completed: report.completed, requested: count, rejected: report.expectedRejections, authenticated: report.authenticated, errors: report.exceptions + report.wrongResult, rps: Math.round(report.requestsPerSecond), p95Ms: report.p95Ms }));
      nextProgress = performance.now() + 10_000;
    }
    if (mode === 'swapped' && report.authenticated > 0) throw new Error('SECURITY_FAILURE: distinct swapped code authenticated');
    if (report.exceptions + report.wrongResult > Math.max(2, report.completed * 0.05)) throw new Error('STOPPED: error rate exceeded 5%; do not increase local load');
    if (freemem() < 1024 ** 3) throw new Error('STOPPED: less than 1 GiB free memory');
  }
  report.outcome = report.exceptions === 0 && report.wrongResult === 0 && (mode === 'http' ? report.authenticated === count : report.expectedRejections === count && report.sessionRows === 0 && report.persistedAttemptRows === count) ? 'passed' : 'failed';
  if (report.outcome !== 'passed') process.exitCode = 1;
} catch (error) {
  report.outcome = error instanceof Error ? error.message : 'failed';
  process.exitCode = 1;
} finally {
  await db.phoneChallenge.deleteMany({ where: { requestKey: marker } });
  await db.user.deleteMany({ where: { phone: { startsWith: phonePrefix }, email: { endsWith: '@phone.invalid' } } });
  report.cleanedUp = true;
  await db.$disconnect();
  await save();
  console.log(JSON.stringify(report, null, 2));
}
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Load test failed'); process.exitCode = 1; });
