import assert from 'node:assert/strict';
import { test } from 'node:test';
import { latinDigits, normalizePhone, safePhoneCallback } from './phone';

test('normalizes Persian, Arabic and international phone numbers', () => {
  for (const value of ['09123456789', '9123456789', '۰۹۱۲ ۳۴۵ ۶۷۸۹', '٠٩١٢٣٤٥٦٧٨٩', '+989123456789', '00989123456789']) {
    assert.equal(normalizePhone(value, '+98'), '+989123456789');
  }
  assert.equal(normalizePhone('015123456789', '+49'), '+4915123456789');
  assert.equal(latinDigits('۰۱۲٣٤٥'), '012345');
  for (const value of ['', 'abc', '0912', '02112345678', '+9809123456789', '912345678901234567']) assert.equal(normalizePhone(value, '+98'), null);
});

test('phone callback rejects external redirects and auth loops', () => {
  for (const value of ['//evil.test', '/\\evil.test', 'https://evil.test', '/auth/phone', '/api/auth/signout', '/\nevil']) assert.equal(safePhoneCallback(value), '/profile');
  assert.equal(safePhoneCallback('/bookings?tab=next#top'), '/bookings?tab=next#top');
});
