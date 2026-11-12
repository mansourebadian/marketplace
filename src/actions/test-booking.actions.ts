'use server';

import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createTestBookingRecord } from '@/lib/test-booking';
import { revalidatePath } from 'next/cache';

const inputSchema = z.object({
  businessId: z.string().min(1).max(36),
  requestId: z.string().uuid(),
  start: z.number().int().safe().positive().max(253402300799999),
  firstVisit: z.boolean(),
  note: z.string().max(1000),
  services: z.array(z.object({ id: z.string().min(1).max(36), memberKey: z.string().min(1).max(36) })).min(1).max(50),
});

export async function createTestBooking(input: unknown): Promise<{ id?: string; error?: string }> {
  if (process.env.NODE_ENV !== 'development' || process.env.BOOKING_TEST_PAYMENTS !== '1') return { error: 'پرداخت آزمایشی در این محیط فعال نیست.' };
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.services.map(service => service.id)).size !== parsed.data.services.length) return { error: 'اطلاعات رزرو معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id) return { error: 'برای ثبت رزرو دوباره وارد حساب خود شوید.' };
  const customerId = session.user.id;
  const verifiedPhone = await prisma.account.findFirst({ where: { userId: customerId, provider: 'phone' }, select: { id: true } });
  if (!verifiedPhone) return { error: 'شماره موبایل خود را تأیید کنید.' };
  const result = await createTestBookingRecord(parsed.data, customerId);
  if (result.id) revalidatePath('/');
  return result;
}

export async function createPayAtVenueBooking(input: unknown): Promise<{ id?: string; error?: string }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.services.map(service => service.id)).size !== parsed.data.services.length) return { error: 'اطلاعات رزرو معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id) return { error: 'برای ثبت رزرو دوباره وارد حساب خود شوید.' };
  const verifiedPhone = await prisma.account.findFirst({ where: { userId: session.user.id, provider: 'phone' }, select: { id: true } });
  if (!verifiedPhone) return { error: 'شماره موبایل خود را تأیید کنید.' };
  const result = await createTestBookingRecord(parsed.data, session.user.id, 'CONFIRMED');
  if (result.id) revalidatePath('/');
  return result;
}
