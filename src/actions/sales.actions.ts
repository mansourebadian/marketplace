'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const d = new Date(`${value}T12:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value; }),
  kind: z.enum(['SALE', 'REFUND']),
  category: z.enum(['SERVICE', 'ADD_ON', 'PRODUCT', 'SHIPPING', 'GIFT_CARD', 'PACKAGE', 'MEMBERSHIP', 'LATE_CANCEL', 'NO_SHOW']),
  paymentType: z.enum(['CASH', 'OTHER', 'GIFT_CARD']),
  quantity: z.coerce.number().int().min(1).max(100000),
  amount: z.coerce.number().int().min(0).max(2147483647),
});

export async function createSale(input: unknown): Promise<{ error?: string }> {
  const data = schema.safeParse(input);
  if (!data.success) return { error: 'اطلاعات تراکنش معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'برای ثبت تراکنش وارد حساب کسب‌وکار شوید.' };
  try {
    const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
    if (!business) return { error: 'کسب‌وکار پیدا نشد.' };
    await prisma.businessSale.create({ data: { ...data.data, businessId: business.id } });
    revalidatePath('/sales/daily-sales');
    return {};
  } catch (error) {
    console.error('Creating sale failed', error);
    return { error: 'ثبت تراکنش انجام نشد. دوباره تلاش کنید.' };
  }
}
