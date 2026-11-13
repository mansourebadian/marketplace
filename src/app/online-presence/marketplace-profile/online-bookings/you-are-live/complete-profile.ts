'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function completeProfile(_state: { error: string }): Promise<{ error: string }> {
  void _state;
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'برای ثبت وضعیت پروفایل ابتدا وارد حساب کسب‌وکار شوید.' };
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, businessAddress: true } });
  if (!business || !business.businessAddress) return { error: 'اطلاعات کسب‌وکار پیدا نشد.' };
  let details: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(business.businessAddress);
    details = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : { address: business.businessAddress };
  } catch { details = { address: business.businessAddress }; }
  const address = JSON.stringify({ ...details, marketplaceSetupComplete: true });
  if (address.length > 1200) return { error: 'فضای ذخیره‌سازی اطلاعات کسب‌وکار کافی نیست.' };
  try {
    const result = await prisma.business.updateMany({ where: { id: business.id, businessAddress: business.businessAddress }, data: { businessAddress: address } });
    if (result.count !== 1) return { error: 'اطلاعات کسب‌وکار تغییر کرده است. دوباره تلاش کنید.' };
  } catch { return { error: 'ثبت وضعیت پروفایل انجام نشد. دوباره تلاش کنید.' }; }
  revalidatePath('/online-presence/marketplace-profile');
  redirect('/online-presence/marketplace-profile');
}
