'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const inputSchema = z.object({
  id: z.string().min(1).max(36),
  previous: z.enum(['BOOKED', 'CONFIRMED', 'ARRIVED', 'STARTED']),
  status: z.enum(['BOOKED', 'CONFIRMED', 'ARRIVED', 'STARTED', 'NO_SHOW', 'CANCELLED']),
  cancellationReason: z.enum(['DUPLICATE_APPOINTMENT', 'BOOKED_BY_MISTAKE', 'CLIENT_UNAVAILABLE']).optional(),
});

export async function checkCancellationEligibility(input: unknown): Promise<{ error?: string; code?: 'PAST_APPOINTMENT' }> {
  const parsed = inputSchema.pick({ id: true, previous: true }).safeParse(input);
  if (!parsed.success) return { error: 'شناسه یا وضعیت نوبت معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی به این نوبت مجاز نیست.' };
  try {
    const reservation = await prisma.businessReservation.findFirst({
      where: { id: parsed.data.id, business: { ownerId: session.user.id }, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] }, appointmentStatus: parsed.data.previous },
      select: { items: { orderBy: { startsAt: 'asc' }, take: 1, select: { startsAt: true } } },
    });
    if (!reservation?.items.length) return { error: 'نوبت پیدا نشد یا وضعیت آن تغییر کرده است. صفحه را تازه کنید.' };
    if (reservation.items[0].startsAt <= new Date()) return { code: 'PAST_APPOINTMENT', error: 'زمان این نوبت گذشته است.' };
    return {};
  } catch (error) {
    console.error('Checking appointment cancellation failed', error);
    return { error: 'بررسی نوبت انجام نشد. دوباره تلاش کنید.' };
  }
}

export async function updateAppointmentStatus(input: unknown): Promise<{ error?: string; code?: 'PAST_APPOINTMENT' }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: 'وضعیت یا شناسه نوبت معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی به این نوبت مجاز نیست.' };
  const { id, status, previous, cancellationReason } = parsed.data;
  const now = new Date();
  try {
    const beforeNoShow = status === 'NO_SHOW' ? await prisma.businessReservation.findFirst({
      where: { id, business: { ownerId: session.user.id }, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] }, appointmentStatus: previous },
      select: { status: true },
    }) : null;
    if (status === 'NO_SHOW' && !beforeNoShow) return { error: 'نوبت پیدا نشد یا وضعیت آن تغییر کرده است. صفحه را تازه کنید.' };
    const result = await prisma.businessReservation.updateMany({
      where: { id, business: { ownerId: session.user.id }, status: beforeNoShow ? beforeNoShow.status : { in: ['CONFIRMED', 'TEST_CONFIRMED'] }, appointmentStatus: previous, ...(status === 'CANCELLED' ? { items: { some: {}, none: { startsAt: { lte: now } } } } : {}) },
      data: { appointmentStatus: status, ...(status === 'CANCELLED' || status === 'NO_SHOW' ? { status } : {}), ...(status === 'CANCELLED' ? { cancellationReason: cancellationReason ?? null } : {}), ...(beforeNoShow ? { beforeNoShowStatus: beforeNoShow.status, beforeNoShowAppointmentStatus: previous } : {}) },
    });
    if (!result.count) {
      if (status === 'CANCELLED') {
        const past = await prisma.businessReservation.findFirst({ where: { id, business: { ownerId: session.user.id }, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] }, appointmentStatus: previous, items: { some: { startsAt: { lte: now } } } }, select: { id: true } });
        if (past) return { error: 'نوبت‌های گذشته قابل لغو نیستند. می‌توانید وضعیت عدم حضور را ثبت کنید.', code: 'PAST_APPOINTMENT' };
      }
      return { error: 'نوبت پیدا نشد یا وضعیت آن تغییر کرده است. صفحه را تازه کنید.' };
    }
    for (const path of ['/sales/appointments-list', '/calendar', '/dashboard', '/activities', '/search']) revalidatePath(path);
    return {};
  } catch (error) {
    console.error('Updating appointment status failed', error);
    return { error: 'ثبت وضعیت انجام نشد. دوباره تلاش کنید.' };
  }
}

export async function undoNoShow(input: unknown): Promise<{ error?: string; status?: string }> {
  const parsed = z.object({ id: z.string().min(1).max(36) }).safeParse(input);
  if (!parsed.success) return { error: 'شناسه نوبت معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی به این نوبت مجاز نیست.' };
  try {
    const reservation = await prisma.businessReservation.findFirst({
      where: { id: parsed.data.id, business: { ownerId: session.user.id }, status: 'NO_SHOW', appointmentStatus: 'NO_SHOW' },
      select: { businessId: true, beforeNoShowStatus: true, beforeNoShowAppointmentStatus: true, items: { select: { memberKey: true, startsAt: true, endsAt: true } } },
    });
    if (!reservation) return { error: 'نوبت پیدا نشد یا وضعیت آن تغییر کرده است. صفحه را تازه کنید.' };
    const restoredStatus = reservation.beforeNoShowStatus === 'TEST_CONFIRMED' ? 'TEST_CONFIRMED' : 'CONFIRMED';
    const restoredAppointmentStatus = ['BOOKED', 'CONFIRMED', 'ARRIVED', 'STARTED'].includes(reservation.beforeNoShowAppointmentStatus ?? '') ? reservation.beforeNoShowAppointmentStatus! : 'BOOKED';
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT [id] FROM [dbo].[Business] WITH (UPDLOCK, HOLDLOCK) WHERE [id] = ${reservation.businessId}`;
      const conflicts = reservation.items.length ? await tx.businessReservationItem.count({
        where: { reservation: { businessId: reservation.businessId, id: { not: parsed.data.id }, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } }, OR: reservation.items.map(item => ({ memberKey: item.memberKey, startsAt: { lt: item.endsAt }, endsAt: { gt: item.startsAt } })) },
      }) : 0;
      if (conflicts) return { count: 0, conflict: true };
      return tx.businessReservation.updateMany({
        where: { id: parsed.data.id, business: { ownerId: session.user.id }, status: 'NO_SHOW', appointmentStatus: 'NO_SHOW', beforeNoShowStatus: reservation.beforeNoShowStatus, beforeNoShowAppointmentStatus: reservation.beforeNoShowAppointmentStatus },
        data: { status: restoredStatus, appointmentStatus: restoredAppointmentStatus, beforeNoShowStatus: null, beforeNoShowAppointmentStatus: null },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
    if ('conflict' in result && result.conflict) return { error: 'این زمان به نوبت دیگری اختصاص داده شده و امکان بازگرداندن آن وجود ندارد.' };
    if (!result.count) return { error: 'وضعیت نوبت تغییر کرده است. صفحه را تازه کنید.' };
    for (const path of ['/sales/appointments-list', '/calendar', '/dashboard', '/activities', '/search']) revalidatePath(path);
    return { status: restoredAppointmentStatus };
  } catch (error) {
    console.error('Undoing no-show failed', error);
    return { error: 'بازگرداندن نوبت انجام نشد. دوباره تلاش کنید.' };
  }
}
