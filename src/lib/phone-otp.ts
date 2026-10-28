import { createHmac, randomBytes, randomInt, timingSafeEqual, randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { safePhoneCallback } from './phone';

export const OTP_COOKIE = 'fresha-phone-challenge';
export const OTP_LIFETIME = 5 * 60 * 1000;
export const OTP_COOLDOWN = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const SESSION_LIFETIME = 30 * 24 * 60 * 60 * 1000;

export class PhoneOtpError extends Error {}

export async function getPhoneChallenge(db: PrismaClient, id: string) {
  return db.phoneChallenge.findFirst({ where: {
    id, delivered: true, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
  } });
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET is required');
  return value;
}

export function otpDigest(id: string, code: string) {
  return createHmac('sha256', secret()).update(`${id}:${code}`).digest('hex');
}

export function requestDigest(value: string) {
  return createHmac('sha256', secret()).update(`phone-request:${value}`).digest('hex');
}

function matchesCode(id: string, code: string, expected: string) {
  const actual = Buffer.from(otpDigest(id, code), 'hex');
  const stored = Buffer.from(expected, 'hex');
  return stored.length === actual.length && timingSafeEqual(actual, stored);
}

// Retry serialization conflicts; all rate limits and one-time consumption are in the database.
async function transactionWithRetry<T>(db: PrismaClient, operation: (tx: Prisma.TransactionClient) => Promise<T>, isolationLevel: Prisma.TransactionIsolationLevel = Prisma.TransactionIsolationLevel.Serializable): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(operation, { isolationLevel });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !['P2034', 'P2002'].includes(error.code) || attempt >= 2) throw error;
    }
  }
}

export async function issuePhoneCode(db: PrismaClient, input: {
  phone: string; flow: 'business' | 'customer'; callbackUrl: string; requestKey: string;
}, send: (phone: string, code: string) => Promise<void>, now = new Date()) {
  const id = randomBytes(32).toString('hex');
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const challenge = await transactionWithRetry(db, async (tx) => {
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recent = await tx.phoneChallenge.findFirst({ where: { phone: input.phone }, orderBy: { createdAt: 'desc' } });
    if (recent && now.getTime() - recent.createdAt.getTime() < OTP_COOLDOWN) {
      throw new PhoneOtpError('برای ارسال مجدد کد، یک دقیقه صبر کنید.');
    }
    const phoneCount = await tx.phoneChallenge.count({ where: { phone: input.phone, createdAt: { gt: hourAgo } } });
    const sourceCount = await tx.phoneChallenge.count({ where: { requestKey: input.requestKey, createdAt: { gt: hourAgo } } });
    if (phoneCount >= 5 || sourceCount >= 20) throw new PhoneOtpError('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید.');
    await tx.phoneChallenge.updateMany({ where: { phone: input.phone, consumedAt: null }, data: { consumedAt: now } });
    return tx.phoneChallenge.create({ data: {
      id, ...input, codeHash: otpDigest(id, code), createdAt: now,
      expiresAt: new Date(now.getTime() + OTP_LIFETIME),
    } });
  });
  try {
    await send(input.phone, code);
    await db.phoneChallenge.update({ where: { id }, data: { delivered: true } });
  } catch {
    await db.phoneChallenge.update({ where: { id }, data: { consumedAt: new Date() } });
    throw new PhoneOtpError('ارسال پیامک انجام نشد. لطفاً یک دقیقه دیگر دوباره تلاش کنید.');
  }
  return challenge;
}

export async function verifyPhoneCode(db: PrismaClient, id: string, code: string, now?: Date) {
  return transactionWithRetry(db, async (tx) => {
    // Lock only this challenge with an atomic conditional update. The lock is held
    // until commit, so concurrent guesses/consumption cannot bypass the attempt limit.
    const claimed = await tx.phoneChallenge.updateMany({ where: {
      id, delivered: true, consumedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS },
      expiresAt: { gt: now ?? new Date() },
    }, data: { attempts: { increment: 1 } } });
    if (claimed.count !== 1) return { error: 'کد منقضی یا غیرفعال شده است. کد جدید درخواست کنید.' } as const;
    const challenge = await tx.phoneChallenge.findUnique({ where: { id } });
    // Evaluate time after acquiring locks too, rather than when the request queued.
    const verifiedAt = now ?? new Date();
    if (!challenge || challenge.expiresAt <= verifiedAt) {
      return { error: 'کد منقضی یا غیرفعال شده است. کد جدید درخواست کنید.' } as const;
    }
    // Commit failed attempts too; throwing here would roll the increment back.
    if (!/^\d{6}$/.test(code) || !matchesCode(id, code, challenge.codeHash)) {
      return { error: challenge.attempts >= OTP_MAX_ATTEMPTS
        ? 'تعداد تلاش‌های مجاز تمام شد. کد جدید درخواست کنید.'
        : 'کد تأیید نادرست است. دوباره تلاش کنید.' } as const;
    }
    await tx.phoneChallenge.update({ where: { id }, data: { consumedAt: verifiedAt } });
    // Profile phone fields are not proof of ownership. Only a verified phone Account can sign in.
    const account = await tx.account.findUnique({
      where: { provider_providerAccountId: { provider: 'phone', providerAccountId: challenge.phone } },
      include: { user: { include: { business: true } } },
    });
    const user = account?.user ?? await tx.user.create({ data: {
      phone: challenge.phone,
      // The existing schema requires email. This non-deliverable random address is never used for email sign-in.
      email: `${randomUUID()}@phone.invalid`,
      role: 'CUSTOMER',
      accounts: { create: { type: 'credentials', provider: 'phone', providerAccountId: challenge.phone } },
    }, include: { business: true } });
    const sessionToken = randomBytes(32).toString('hex');
    const expires = new Date(verifiedAt.getTime() + SESSION_LIFETIME);
    await tx.session.create({ data: { sessionToken, userId: user.id, expires } });
    let destination = safePhoneCallback(challenge.callbackUrl);
    if (user.role === 'OWNER') {
      destination = user.business?.businessAddress ? '/calendar' : '/onboarding/business-name';
    } else if (user.role !== 'CUSTOMER') {
      destination = '/';
    } else if (challenge.flow === 'business') {
      destination = '/auth/business/complete';
    }
    return { sessionToken, expires, destination } as const;
  }, Prisma.TransactionIsolationLevel.ReadCommitted);
}
