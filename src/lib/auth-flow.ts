import type { NextRequest } from 'next/server';

// This selects presentation only; account permissions still come from the database.
export async function getAuthPage(request?: NextRequest) {
  if (!request) return '/auth/customer';

  let callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
  if (request.method === 'POST' &&
      request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    const body = new URLSearchParams(await request.clone().text());
    callbackUrl = body.get('callbackUrl') ?? callbackUrl;
  }

  const cookies = request.cookies;
  const destination = callbackUrl ??
    cookies.get('__Secure-authjs.callback-url')?.value ??
    cookies.get('authjs.callback-url')?.value;

  // Provider discovery can fail before Auth.js has saved the callback cookie.
  const referer = request.headers.get('referer');
  let candidate = destination;
  if (!callbackUrl && referer && !request.nextUrl.pathname.includes('/callback/')) {
    try {
      const source = new URL(referer);
      if (source.origin === request.nextUrl.origin &&
          (source.pathname === '/auth/business' || source.pathname === '/auth/customer')) {
        candidate = referer;
      }
    } catch {
      // Retain the saved callback when the referrer is invalid.
    }
  }

  if (candidate) {
    try {
      const url = new URL(candidate, request.nextUrl.origin);
      if (url.origin === request.nextUrl.origin &&
          (url.pathname === '/auth/business' ||
           url.pathname.startsWith('/auth/business/') ||
           url.pathname === '/onboarding' ||
           url.pathname.startsWith('/onboarding/'))) {
        return '/auth/business';
      }
    } catch {
      // Invalid destinations fall back to the customer sign-in page.
    }
  }

  return '/auth/customer';
}
