// Shared by Auth.js and the phone verification action, using database sessions.
export function sessionCookie() {
  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  const secure = url ? new URL(url).protocol === 'https:' : process.env.NODE_ENV === 'production';
  return {
    name: `${secure ? '__Secure-' : ''}authjs.session-token`,
    options: { httpOnly: true, sameSite: 'lax' as const, path: '/', secure },
  };
}
