import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { issuePhoneCode, otpDigest, OTP_COOKIE } from './phone-otp';
import { sessionCookie } from './session-cookie';

test('phone verification HTTP action creates an Auth.js session only for a correct code', { skip: process.env.OTP_HTTP_TEST !== '1' }, async () => {
  config({ path: ['.env.local', '.env'], quiet: true });
  const db = new PrismaClient();
  const phone = `+999${BigInt(`0x${randomBytes(5).toString('hex')}`).toString().padStart(13, '0')}`;
  const otherPhone = `${phone}1`;
  const origin = 'http://localhost:3000';
  const decode = (value: string) => value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  try {
    const anonymous = await fetch(`${origin}/auth/phone`, { redirect: 'manual' });
    assert.equal(anonymous.status, 307);
    let code = '';
    const challenge = await issuePhoneCode(db, { phone, flow: 'business', callbackUrl: '/profile', requestKey: randomBytes(32).toString('hex') }, async (_, value) => { code = value; });
    const other = await issuePhoneCode(db, { phone: otherPhone, flow: 'business', callbackUrl: '/profile', requestKey: randomBytes(32).toString('hex') }, async () => {});
    const otherCode = code === '111111' ? '222222' : '111111';
    await db.phoneChallenge.update({ where: { id: other.id }, data: { codeHash: otpDigest(other.id, otherCode) } });
    const cookie = `${OTP_COOKIE}=${challenge.id}`;
    const response = await fetch(`${origin}/auth/phone`, { headers: { cookie } });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal([...html.matchAll(/aria-label="رقم \d کد تأیید"/g)].length, 6);
    const submit = async (value: string, requestCookie = cookie) => {
      const data = new FormData();
      for (const match of html.matchAll(/<input\b[^>]*>/g)) {
        const name = match[0].match(/name="([^"]*)"/)?.[1];
        if (name?.startsWith('$ACTION')) data.set(decode(name), decode(match[0].match(/value="([^"]*)"/)?.[1] ?? ''));
      }
      data.set('code', value);
      // These client-supplied identity fields must never override the server's cookie-bound challenge.
      data.set('phone', otherPhone);
      data.set('challengeId', other.id);
      return fetch(`${origin}/auth/phone`, { method: 'POST', headers: { cookie: requestCookie, origin }, body: data, redirect: 'manual' });
    };
    const wrong = await submit(code === '000000' ? '111111' : '000000');
    assert.equal(wrong.status, 200);
    assert.ok(!(wrong.headers.get('set-cookie') ?? '').includes(sessionCookie().name));
    assert.equal(await db.user.count({ where: { phone } }), 0);
    for (const swapped of [await submit(otherCode), await submit(code, `${OTP_COOKIE}=${other.id}`)]) {
      assert.equal(swapped.status, 200);
      assert.ok(!(swapped.headers.get('set-cookie') ?? '').includes(sessionCookie().name));
    }
    assert.equal(await db.user.count({ where: { phone: { in: [phone, otherPhone] } } }), 0);
    const correct = await submit(code);
    assert.equal(correct.status, 303);
    assert.equal(correct.headers.get('location'), '/auth/business/complete');
    const sessionHeader = correct.headers.getSetCookie().find(value => value.startsWith(`${sessionCookie().name}=`));
    assert.ok(sessionHeader);
    assert.match(sessionHeader, /httponly/i);
    const authenticated = await fetch(`${origin}/api/auth/session`, { headers: { cookie: sessionHeader.split(';')[0] } });
    const session = await authenticated.json();
    const user = await db.user.findFirstOrThrow({ where: { phone } });
    assert.equal(session.user.id, user.id);
    assert.equal(await db.user.count({ where: { phone: otherPhone } }), 0);
    const replay = await submit(code);
    assert.ok(!(replay.headers.get('set-cookie') ?? '').includes(sessionCookie().name));
    assert.equal(await db.session.count({ where: { userId: user.id } }), 1);
  } finally {
    await db.phoneChallenge.deleteMany({ where: { phone: { in: [phone, otherPhone] } } });
    await db.user.deleteMany({ where: { phone: { in: [phone, otherPhone] }, email: { endsWith: '@phone.invalid' } } });
    await db.$disconnect();
  }
});
