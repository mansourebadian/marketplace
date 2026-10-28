import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { setTimeout as delay } from 'node:timers/promises';
import 'dotenv/config';
import { issuePhoneCode, verifyPhoneCode, otpDigest, OTP_LIFETIME, OTP_COOLDOWN } from './phone-otp';
import { sendPhoneCode } from './sms';

for (const flow of ['business', 'customer']) {
  test('existing business owner signing in by phone through ' + flow + ' is sent to the business panel', async () => {
    const previousSecret = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = 'isolated-routing-test-secret';
    const now = new Date();
    const user = { id: 'existing-owner', role: 'OWNER', business: { businessAddress: '{}' } };
    let sessionUserId: string | undefined;
    const transaction = {
      phoneChallenge: {
        updateMany: async () => ({ count: 1 }),
        findUnique: async () => ({ id: 'routing-challenge', phone: '+989123456789', flow, callbackUrl: '/profile', attempts: 1, expiresAt: new Date(now.getTime() + OTP_LIFETIME), codeHash: otpDigest('routing-challenge', '123456') }),
        update: async () => ({}),
      },
      account: { findUnique: async () => ({ user }) },
      session: { create: async ({ data }: { data: { userId: string } }) => { sessionUserId = data.userId; } },
    };
    const db = { $transaction: async (operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction) } as unknown as PrismaClient;
    try {
      const result = await verifyPhoneCode(db, 'routing-challenge', '123456', now);
      assert.ok('sessionToken' in result);
      assert.equal(result.destination, '/calendar');
      assert.equal(sessionUserId, user.id);
    } finally {
      if (previousSecret === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = previousSecret;
    }
  });
}


// Explicit opt-in: exercises real database transactions with synthetic, isolated records.
test('phone OTP database lifecycle', { skip: process.env.OTP_DB_TEST !== '1' }, async t => {
  const db = new PrismaClient();
  const phones: string[] = [];
  const oldSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = 'isolated-otp-test-secret-not-for-production';
  const input = () => {
    const phone = `+999${BigInt(`0x${randomBytes(5).toString('hex')}`).toString().padStart(13, '0')}`;
    phones.push(phone);
    return { phone, flow: 'business' as const, callbackUrl: '/profile', requestKey: randomBytes(32).toString('hex') };
  };
  try {
    await t.test('development console OTP creates a real session with the printed code', async t => {
      const before = { provider: process.env.SMS_PROVIDER, nodeEnv: process.env.NODE_ENV };
      const logs = t.mock.method(console, 'info', () => {});
      try {
        Object.assign(process.env, { SMS_PROVIDER: 'console', NODE_ENV: 'development' });
        const challenge = await issuePhoneCode(db, input(), sendPhoneCode);
        const printed = String(logs.mock.calls[0]?.arguments[0]);
        const code = printed.match(/code=(\d{6})\b/)?.[1];
        assert.ok(code);
        const result = await verifyPhoneCode(db, challenge.id, code);
        assert.ok('sessionToken' in result);
        assert.ok(await db.session.findUnique({ where: { sessionToken: result.sessionToken } }));
      } finally {
        if (before.provider === undefined) delete process.env.SMS_PROVIDER; else process.env.SMS_PROVIDER = before.provider;
        if (before.nodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV'); else Object.assign(process.env, { NODE_ENV: before.nodeEnv });
      }
    });
    await t.test('distinct codes swapped between two live challenges cannot authenticate', async () => {
      const first = await issuePhoneCode(db, input(), async () => {});
      const second = await issuePhoneCode(db, input(), async () => {});
      await db.phoneChallenge.update({ where: { id: first.id }, data: { codeHash: otpDigest(first.id, '123456') } });
      await db.phoneChallenge.update({ where: { id: second.id }, data: { codeHash: otpDigest(second.id, '654321') } });
      const results = await Promise.all([verifyPhoneCode(db, first.id, '654321'), verifyPhoneCode(db, second.id, '123456')]);
      assert.ok(results.every(result => 'error' in result));
      assert.equal(await db.user.count({ where: { phone: { in: [first.phone, second.phone] } } }), 0);
    });
    await t.test('identical numeric codes are not globally unique identities', async () => {
      const first = await issuePhoneCode(db, input(), async () => {});
      const second = await issuePhoneCode(db, input(), async () => {});
      for (const challenge of [first, second]) await db.phoneChallenge.update({ where: { id: challenge.id }, data: { codeHash: otpDigest(challenge.id, '123456') } });
      const results = await Promise.all([verifyPhoneCode(db, first.id, '123456'), verifyPhoneCode(db, second.id, '123456')]);
      assert.ok(results.every(result => 'sessionToken' in result));
      const sessions = await db.session.findMany({ where: { sessionToken: { in: results.flatMap(result => result.sessionToken ? [result.sessionToken] : []) } }, include: { user: true } });
      assert.deepEqual(new Set(sessions.map(session => session.user.phone)), new Set([first.phone, second.phone]));
    });
    await t.test('a code that expires while awaiting a transaction is rejected', async () => {
      let code = '';
      const challenge = await issuePhoneCode(db, input(), async (_, value) => { code = value; });
      await db.phoneChallenge.update({ where: { id: challenge.id }, data: { expiresAt: new Date(Date.now() + 100) } });
      // Delay acquisition only, then execute the unchanged verification against the real database.
      const queuedDb = new Proxy(db, { get(target, property) {
        if (property !== '$transaction') return Reflect.get(target, property);
        return async (...parameters: Parameters<typeof db.$transaction>) => {
          await delay(200);
          return db.$transaction(...parameters);
        };
      } });
      const result = await verifyPhoneCode(queuedDb, challenge.id, code);
      assert.ok('error' in result, 'must evaluate expiry after queueing, not at request arrival');
      assert.equal(await db.user.count({ where: { phone: challenge.phone } }), 0);
    });
    await t.test('64 concurrent wrong guesses cannot exceed five committed attempts', async () => {
      let code = '';
      const challenge = await issuePhoneCode(db, input(), async (_, value) => { code = value; });
      const wrong = code === '000000' ? '111111' : '000000';
      const results = await Promise.all(Array.from({ length: 64 }, () => verifyPhoneCode(db, challenge.id, wrong)));
      assert.ok(results.every(result => 'error' in result));
      assert.equal((await db.phoneChallenge.findUniqueOrThrow({ where: { id: challenge.id } })).attempts, 5);
      assert.ok('error' in await verifyPhoneCode(db, challenge.id, code));
      assert.equal(await db.user.count({ where: { phone: challenge.phone } }), 0);
    });
    await t.test('wrong code creates no account; correct code creates session; reuse and concurrent verification fail', async () => {
      const args = input();
      let code = '';
      const challenge = await issuePhoneCode(db, args, async (_, value) => { code = value; });
      assert.match(code, /^\d{6}$/);
      assert.notEqual(challenge.codeHash, code);
      const wrong = code === '000000' ? '111111' : '000000';
      assert.ok('error' in await verifyPhoneCode(db, challenge.id, wrong));
      assert.equal(await db.user.count({ where: { phone: args.phone } }), 0);
      const results = await Promise.all([verifyPhoneCode(db, challenge.id, code), verifyPhoneCode(db, challenge.id, code)]);
      assert.equal(results.filter(result => 'sessionToken' in result).length, 1);
      const success = results.find(result => 'sessionToken' in result)!;
      assert.equal(success.destination, '/auth/business/complete');
      assert.ok(await db.session.findUnique({ where: { sessionToken: success.sessionToken } }));
      assert.ok('error' in await verifyPhoneCode(db, challenge.id, code));
      assert.equal(await db.user.count({ where: { phone: args.phone } }), 1);
    });
    await t.test('expiry and failed-attempt lockout reject even the correct code', async () => {
      let code = '';
      const challenge = await issuePhoneCode(db, input(), async (_, value) => { code = value; });
      assert.ok('error' in await verifyPhoneCode(db, challenge.id, code, new Date(challenge.createdAt.getTime() + OTP_LIFETIME + 1)));
      const wrong = code === '000000' ? '111111' : '000000';
      for (let i = 0; i < 5; i++) assert.ok('error' in await verifyPhoneCode(db, challenge.id, wrong));
      assert.ok('error' in await verifyPhoneCode(db, challenge.id, code));
      assert.equal((await db.phoneChallenge.findUniqueOrThrow({ where: { id: challenge.id } })).attempts, 5);
    });
    await t.test('resend invalidates the old code and enforces server cooldown and hourly limit', async () => {
      const args = input();
      let oldCode = '';
      const first = await issuePhoneCode(db, args, async (_, value) => { oldCode = value; });
      await assert.rejects(issuePhoneCode(db, args, async () => {}), /یک دقیقه/);
      const later = new Date(first.createdAt.getTime() + OTP_COOLDOWN + 1);
      let code = '';
      const second = await issuePhoneCode(db, args, async (_, value) => { code = value; }, later);
      assert.ok('error' in await verifyPhoneCode(db, first.id, oldCode, later));
      assert.ok('sessionToken' in await verifyPhoneCode(db, second.id, code, later));
      for (let i = 2; i < 5; i++) await issuePhoneCode(db, args, async () => {}, new Date(first.createdAt.getTime() + i * (OTP_COOLDOWN + 1)));
      await assert.rejects(issuePhoneCode(db, args, async () => {}, new Date(first.createdAt.getTime() + 5 * (OTP_COOLDOWN + 1))), /بیش از حد/);
    });
    await t.test('provider failures never produce a usable challenge', async () => {
      const args = input();
      let code = '';
      await assert.rejects(issuePhoneCode(db, args, async (_, value) => { code = value; throw new Error('provider unavailable'); }), /ارسال پیامک/);
      const challenge = await db.phoneChallenge.findFirstOrThrow({ where: { phone: args.phone } });
      assert.equal(challenge.delivered, false);
      assert.ok('error' in await verifyPhoneCode(db, challenge.id, code));
    });
    await t.test('returning verified users keep their identity and role', async () => {
      const args = { ...input(), flow: 'customer' as const, callbackUrl: '/bookings' };
      let code = '';
      const first = await issuePhoneCode(db, args, async (_, value) => { code = value; });
      const result = await verifyPhoneCode(db, first.id, code);
      assert.equal(result.destination, '/bookings');
      const user = await db.user.findFirstOrThrow({ where: { phone: args.phone } });
      await db.user.update({ where: { id: user.id }, data: { role: 'OWNER', business: { create: { name: 'OTP isolated test', businessAddress: '{}' } } } });
      const later = new Date(first.createdAt.getTime() + OTP_COOLDOWN + 1);
      const second = await issuePhoneCode(db, args, async (_, value) => { code = value; }, later);
      assert.equal((await verifyPhoneCode(db, second.id, code, later)).destination, '/calendar');
      assert.equal(await db.user.count({ where: { phone: args.phone } }), 1);
    });
  } finally {
    await db.phoneChallenge.deleteMany({ where: { phone: { in: phones } } });
    await db.user.deleteMany({ where: { phone: { in: phones }, email: { endsWith: '@phone.invalid' } } });
    await db.$disconnect();
    if (oldSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = oldSecret;
  }
});
