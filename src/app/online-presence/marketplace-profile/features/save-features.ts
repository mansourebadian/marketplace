'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { featureIds } from './options';

export async function saveFeatures(_state: { error: string }, formData: FormData): Promise<{ error: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const values = formData.getAll('features');
  if (values.some(value => typeof value !== 'string' || !featureIds.includes(value)) || new Set(values).size !== values.length) return { error: 'گزینه‌های انتخاب‌شده معتبر نیستند.' };
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  let details: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(business.businessAddress || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) details = parsed as Record<string, unknown>;
  } catch { if (business.businessAddress) details = { address: business.businessAddress }; }
  const venueFeatures = featureIds.reduce((mask, id, index) => values.includes(id) ? mask | (1 << index) : mask, 0);
  const address = JSON.stringify({ ...details, venueFeatures });
  if (address.length > 1200) return { error: 'فضای ذخیره‌سازی اطلاعات کسب‌وکار کافی نیست.' };
  try { await prisma.business.update({ where: { id: business.id }, data: { businessAddress: address }, select: { id: true } }); }
  catch { return { error: 'ذخیرهٔ ویژگی‌ها انجام نشد. دوباره تلاش کنید.' }; }
  redirect(formData.get('destination') === 'about' ? '/online-presence/marketplace-profile/about' : '/online-presence/marketplace-profile');
}
