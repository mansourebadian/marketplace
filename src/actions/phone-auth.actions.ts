'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { normalizePhone, latinDigits, safePhoneCallback } from '@/lib/phone';
import { issuePhoneCode, verifyPhoneCode, requestDigest, OTP_COOKIE, PhoneOtpError } from '@/lib/phone-otp';
import { sendPhoneCode, smsConfigured } from '@/lib/sms';
import { sessionCookie } from '@/lib/session-cookie';

export type PhoneAuthState = { error?: string; sent?: boolean };

async function sendCode(phone: string, flow: 'business' | 'customer', callbackUrl: string): Promise<PhoneAuthState> {
  if (!smsConfigured()) return { error: 'سرویس ارسال پیامک هنوز تنظیم نشده است. لطفاً با پشتیبانی تماس بگیرید.' };
  try {
    const requestHeaders = await headers();
    // Only trust an IP header explicitly configured and overwritten by the deployment proxy.
    // Without one, the shared bucket provides a conservative server-wide sending limit.
    const ipHeader = process.env.OTP_TRUSTED_IP_HEADER;
    const source = ipHeader ? requestHeaders.get(ipHeader)?.split(',')[0]?.trim() : null;
    const challenge = await issuePhoneCode(prisma, {
      phone, flow, callbackUrl, requestKey: requestDigest(source || 'shared'),
    }, sendPhoneCode);
    (await cookies()).set(OTP_COOKIE, challenge.id, {
      ...sessionCookie().options, maxAge: 60 * 60,
    });
  } catch (error) {
    return { error: error instanceof PhoneOtpError ? error.message : 'درخواست کد انجام نشد. لطفاً دوباره تلاش کنید.' };
  }
  return { sent: true };
}

export async function requestPhoneOtp(formData: FormData): Promise<PhoneAuthState> {
  const rawPhone = formData.get('phone');
  const rawDialCode = formData.get('dialCode');
  const flow = formData.get('flow');
  if (typeof rawPhone !== 'string' || rawPhone.length > 40 || typeof rawDialCode !== 'string' || !['business', 'customer'].includes(String(flow))) {
    return { error: 'اطلاعات شماره موبایل معتبر نیست.' };
  }
  const phone = normalizePhone(rawPhone, rawDialCode);
  if (!phone) return { error: 'لطفاً شماره موبایل معتبر وارد کنید.' };
  const callbackUrl = String(formData.get('callbackUrl') || '/profile').slice(0, 2048);
  return sendCode(phone, flow as 'business' | 'customer', safePhoneCallback(callbackUrl));
}

export async function resendPhoneOtp(): Promise<PhoneAuthState> {
  const id = (await cookies()).get(OTP_COOKIE)?.value;
  if (!id) return { error: 'دوباره شماره موبایل خود را وارد کنید.' };
  const challenge = await prisma.phoneChallenge.findUnique({ where: { id } });
  if (!challenge || challenge.createdAt.getTime() < Date.now() - 60 * 60 * 1000) return { error: 'دوباره شماره موبایل خود را وارد کنید.' };
  return sendCode(challenge.phone, challenge.flow === 'business' ? 'business' : 'customer', challenge.callbackUrl);
}

export async function confirmPhoneOtp(_previous: PhoneAuthState, formData: FormData): Promise<PhoneAuthState> {
  const cookieStore = await cookies();
  const id = cookieStore.get(OTP_COOKIE)?.value;
  if (!id) return { error: 'درخواست تأیید پیدا نشد. دوباره شماره موبایل خود را وارد کنید.' };
  const code = latinDigits(String(formData.get('code') || '')).trim();
  if (!/^\d{6}$/.test(code)) return { error: 'کد شش‌رقمی را کامل وارد کنید.' };
  let destination: string;
  try {
    const result = await verifyPhoneCode(prisma, id, code);
    if ('error' in result) return { error: result.error };
    const cookie = sessionCookie();
    cookieStore.set(cookie.name, result.sessionToken, { ...cookie.options, expires: result.expires });
    cookieStore.delete(OTP_COOKIE);
    destination = result.destination;
  } catch {
    return { error: 'تأیید شماره انجام نشد. لطفاً دوباره تلاش کنید.' };
  }
  redirect(destination);
}
