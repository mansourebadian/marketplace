'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function cancelReservation(id: string): Promise<{ error?: string }> {
  if (!z.string().min(1).max(36).safeParse(id).success) return { error: 'شناسه نوبت معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id) return { error: 'برای لغو نوبت وارد حساب خود شوید.' };
  try {
    const result = await prisma.$transaction(async tx => {
      const reservation = await tx.businessReservation.findFirst({ where: { id, customerId: session.user.id }, select: { status: true, items: { orderBy: { position: 'asc' }, take: 1, select: { startsAt: true } } } });
      if (!reservation || reservation.status !== 'CONFIRMED' || !reservation.items[0]) return { error: 'این نوبت قابل لغو نیست.' };
      if (reservation.items[0].startsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000) return { error: 'مهلت لغو آنلاین به پایان رسیده است. با مجموعه تماس بگیرید.' };
      const updated = await tx.businessReservation.updateMany({ where: { id, customerId: session.user.id, status: 'CONFIRMED' }, data: { status: 'CANCELLED' } });
      return updated.count === 1 ? {} : { error: 'وضعیت نوبت تغییر کرده است. صفحه را تازه کنید.' };
    });
    if (!result.error) { revalidatePath('/activities'); revalidatePath('/calendar'); }
    return result;
  } catch (error) {
    console.error('Cancelling reservation failed', error);
    return { error: 'لغو نوبت انجام نشد. دوباره تلاش کنید.' };
  }
}
