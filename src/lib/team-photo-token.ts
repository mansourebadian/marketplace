import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

function signature(payload: string) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createTeamPhotoToken(name: string, ownerId: string) {
  const payload = Buffer.from(JSON.stringify({ name, ownerId, expires: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyTeamPhotoToken(token: string, ownerId: string): string | null {
  try {
    const [payload, mac, extra] = token.split('.');
    if (!payload || !mac || extra) return null;
    const expected = Buffer.from(signature(payload));
    const received = Buffer.from(mac);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
    const data: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data !== 'object' || !('name' in data) || !('ownerId' in data) || !('expires' in data)) return null;
    if (typeof data.name !== 'string' || !/^[0-9a-f-]{36}\.png$/i.test(data.name) || data.ownerId !== ownerId || typeof data.expires !== 'number' || data.expires < Date.now()) return null;
    return data.name;
  } catch { return null; }
}
