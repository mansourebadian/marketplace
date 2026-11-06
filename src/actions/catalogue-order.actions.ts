'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const inputSchema = z.object({ categoryKey: z.string().min(1).max(72), items: z.array(z.object({ id: z.string().min(1).max(36), kind: z.enum(['service', 'bundle']) })).min(1).max(1000) });

export async function reorderCatalogue(input: unknown): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی غیرمجاز است.' };
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.items.map(item => `${item.kind}:${item.id}`)).size !== parsed.data.items.length) return { error: 'ترتیب خدمات معتبر نیست.' };
  const { categoryKey, items } = parsed.data;
  try {
    const saved = await prisma.$transaction(async tx => {
      const business = await tx.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
      if (!business) return false;
      const [services, bundles] = await Promise.all([
        tx.businessService.findMany({ where: { businessId: business.id, categoryKey }, select: { id: true } }),
        tx.businessBundle.findMany({ where: { businessId: business.id, categoryKey }, select: { id: true } }),
      ]);
      const expected = new Set([...services.map(item => `service:${item.id}`), ...bundles.map(item => `bundle:${item.id}`)]);
      if (expected.size !== items.length || items.some(item => !expected.has(`${item.kind}:${item.id}`))) return false;
      for (const [position, item] of items.entries()) {
        if (item.kind === 'service') await tx.businessService.update({ where: { id: item.id }, data: { position } });
        else await tx.businessBundle.update({ where: { id: item.id }, data: { position } });
      }
      return true;
    }, { isolationLevel: 'Serializable' });
    if (!saved) return { error: 'فهرست خدمات تغییر کرده است. صفحه را تازه کنید و دوباره تلاش کنید.' };
  } catch (error) { console.error('Failed to reorder catalogue', error); return { error: 'ذخیره ترتیب انجام نشد. دوباره تلاش کنید.' }; }
  revalidatePath('/catalogue/services');
  return {};
}
