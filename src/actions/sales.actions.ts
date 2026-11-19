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

const quickSaleSchema = z.object({
  date: schema.shape.date,
  paymentType: z.enum(['CASH', 'OTHER']),
  customerId: z.string().min(1).max(1000).nullable(),
  items: z.array(z.object({ id: z.string().min(1).max(36), quantity: z.number().int().min(1).max(100), price: z.number().int().min(0).max(2147483647) })).min(1).max(50),
});

export async function createQuickSale(input: unknown): Promise<{ error?: string }> {
  const parsed = quickSaleSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.items.map(item => item.id)).size !== parsed.data.items.length) return { error: 'اطلاعات سبد خرید معتبر نیست.' };
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'برای ثبت فروش وارد حساب کسب‌وکار شوید.' };
  try {
    const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
    if (!business) return { error: 'کسب‌وکار پیدا نشد.' };
    const items = parsed.data.items;
    const result = await prisma.$transaction(async tx => {
      if (parsed.data.customerId && !(await tx.businessReservation.findFirst({ where: { businessId: business.id, customerId: parsed.data.customerId }, select: { id: true } }))) return false;
      const services = await tx.businessService.findMany({ where: { businessId: business.id, id: { in: items.map(item => item.id) } }, select: { id: true, price: true, priceType: true } });
      if (services.length !== items.length || items.some(item => { const service = services.find(entry => entry.id === item.id); return !service || !['FIXED', 'FREE'].includes(service.priceType) || (service.priceType === 'FREE' ? 0 : service.price) !== item.price; })) return false;
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (!Number.isSafeInteger(total) || total > 2147483647) return false;
      await tx.businessSale.create({ data: { businessId: business.id, customerId: parsed.data.customerId, date: parsed.data.date, kind: 'SALE', category: 'SERVICE', paymentType: parsed.data.paymentType, amount: total, quantity } });
      return true;
    });
    if (!result) return { error: 'مشتری، خدمات یا قیمت‌ها معتبر نیستند؛ صفحه را تازه کنید و دوباره تلاش کنید.' };
    revalidatePath('/sales/daily-sales');
    return {};
  } catch (error) {
    console.error('Creating quick sale failed', error);
    return { error: 'ثبت فروش انجام نشد. دوباره تلاش کنید.' };
  }
}
