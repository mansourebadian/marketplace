import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { getAuthPage } from './auth-flow';

const origin = 'https://example.com';

test('business sign-in uses submitted callback over an old customer cookie', async () => {
  const request = new NextRequest(`${origin}/api/auth/signin/google`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      cookie: `authjs.callback-url=${encodeURIComponent(`${origin}/profile`)}`,
    },
    body: new URLSearchParams({ callbackUrl: '/auth/business/complete' }),
  });
  assert.equal(await getAuthPage(request), '/auth/business');
  assert.match(await request.text(), /callbackUrl/);
});

for (const name of ['authjs.callback-url', '__Secure-authjs.callback-url']) {
  test(`OAuth callback errors preserve business flow with ${name}`, async () => {
    const request = new NextRequest(`${origin}/api/auth/callback/google?error=access_denied`, {
      headers: {
        cookie: `${name}=${encodeURIComponent(`${origin}/auth/business/complete`)}`,
        referer: 'https://accounts.google.com/',
      },
    });
    assert.equal(await getAuthPage(request), '/auth/business');
  });
}

test('provider discovery uses the current login page over stale cookies', async () => {
  for (const flow of ['business', 'customer']) {
    const request = new NextRequest(`${origin}/api/auth/providers`, {
      headers: {
        referer: `${origin}/auth/${flow}`,
        cookie: `authjs.callback-url=${encodeURIComponent(`${origin}/auth/business/complete`)}`,
      },
    });
    assert.equal(await getAuthPage(request), `/auth/${flow}`);
  }
});

test('customer destinations, external URLs and missing requests keep customer flow', async () => {
  for (const callbackUrl of ['/profile', 'https://other.example/auth/business/complete', 'http://[']) {
    const request = new NextRequest(`${origin}/api/auth/signin?${new URLSearchParams({ callbackUrl })}`);
    assert.equal(await getAuthPage(request), '/auth/customer');
  }
  assert.equal(await getAuthPage(), '/auth/customer');
});
