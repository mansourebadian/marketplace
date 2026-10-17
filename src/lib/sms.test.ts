import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sendPhoneCode, smsConfigured } from './sms';

test('SMS adapters use configured providers and fail closed', async t => {
  const values = {
    SMS_PROVIDER: '', KAVENEGAR_API_KEY: 'test-key', KAVENEGAR_OTP_TEMPLATE: 'test-pattern',
    MELIPAYAMAK_USERNAME: 'test-user', MELIPAYAMAK_PASSWORD: 'test-password', MELIPAYAMAK_BODY_ID: '123',
    TWILIO_ACCOUNT_SID: 'ACtest', TWILIO_AUTH_TOKEN: 'test-token', TWILIO_FROM: '+15555550100',
    SMS_WEBHOOK_URL: 'https://gateway.example.test/otp', SMS_WEBHOOK_TOKEN: 'test-token',
  };
  const before = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    assert.equal(smsConfigured(), false);
    await assert.rejects(sendPhoneCode('+989123456789', '012345'), /NOT_CONFIGURED/);
    for (const fixture of [
      { provider: 'kavenegar', host: 'api.kavenegar.com', success: { return: { status: 200 } }, failure: { return: { status: 401 } } },
      { provider: 'melipayamak', host: 'rest.payamak-panel.com', success: { RetStatus: 1, Value: '123456789' }, failure: { RetStatus: 1, Value: '-1' } },
      { provider: 'twilio', host: 'api.twilio.com', success: { sid: 'SMtest', status: 'queued' }, failure: { sid: 'SMtest', status: 'failed' } },
      { provider: 'webhook', host: 'gateway.example.test', success: { accepted: true }, failure: { accepted: false } },
    ]) {
      await t.test(fixture.provider, async t => {
        process.env.SMS_PROVIDER = fixture.provider;
        assert.equal(smsConfigured(), true);
        const fetchMock = t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options?: RequestInit) => {
          assert.equal(new URL(String(url)).hostname, fixture.host);
          assert.equal(options?.method, 'POST');
          assert.ok(String(options?.body).includes('012345'));
          return Response.json(fixture.success);
        });
        await sendPhoneCode('+989123456789', '012345');
        fetchMock.mock.mockImplementation(async () => Response.json(fixture.failure));
        await assert.rejects(sendPhoneCode('+989123456789', '012345'), /SEND_FAILED/);
        fetchMock.mock.mockImplementation(async () => { throw new Error('network failure'); });
        await assert.rejects(sendPhoneCode('+989123456789', '012345'));
      });
    }
    process.env.SMS_PROVIDER = 'webhook';
    process.env.SMS_WEBHOOK_URL = 'http://gateway.example.test/otp';
    assert.equal(smsConfigured(), false);
  } finally {
    for (const [key, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('console provider prints OTP only in development and never sends a request', async t => {
  const previous = { provider: process.env.SMS_PROVIDER, nodeEnv: process.env.NODE_ENV };
  const logs = t.mock.method(console, 'info', () => {});
  const network = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network call'); });
  try {
    Object.assign(process.env, { SMS_PROVIDER: 'console', NODE_ENV: 'development' });
    assert.equal(smsConfigured(), true);
    await sendPhoneCode('+989123456789', '012345');
    assert.equal(logs.mock.callCount(), 1);
    assert.equal(logs.mock.calls[0].arguments[0], '[OTP:DEV] phone=+989123456789 code=012345 expires=5min');
    for (const nodeEnv of ['production', 'test', '']) {
      Object.assign(process.env, { NODE_ENV: nodeEnv });
      assert.equal(smsConfigured(), false);
      await assert.rejects(sendPhoneCode('+989123456789', '012345'), /NOT_CONFIGURED/);
    }
    assert.equal(logs.mock.callCount(), 1);
    assert.equal(network.mock.callCount(), 0);
  } finally {
    if (previous.provider === undefined) delete process.env.SMS_PROVIDER; else process.env.SMS_PROVIDER = previous.provider;
    if (previous.nodeEnv === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV'); else Object.assign(process.env, { NODE_ENV: previous.nodeEnv });
  }
});
