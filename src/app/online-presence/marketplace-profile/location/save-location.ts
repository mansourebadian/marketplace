'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const dataSchema = z.object({ address: z.string().trim().max(300), directions: z.string().trim().max(200), point: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional() });

export async function saveLocation(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const rawPoint = formData.get('point');
  const data = dataSchema.parse({ address: formData.get('address'), directions: formData.get('directions'), point: typeof rawPoint === 'string' && rawPoint ? JSON.parse(rawPoint) : undefined });
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, businessAddress: true, locations: { orderBy: { createdAt: 'asc' }, take: 1, select: { id: true } } } });
  if (!business) redirect('/onboarding/business-name');
  let previous: Record<string, unknown> = {};
  try { const parsed: unknown = JSON.parse(business.businessAddress || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) previous = parsed as Record<string, unknown>; } catch { /* Keep only the newly supplied fields. */ }
  const businessAddress = JSON.stringify({ ...previous, ...data });
  if (businessAddress.length > 1200) throw new Error('Address too long');
  await prisma.$transaction(async tx => {
    await tx.business.update({ where: { id: business.id }, data: { businessAddress } });
    if (business.locations[0]) await tx.businessLocation.updateMany({ where: { id: business.locations[0].id, businessId: business.id }, data: { address: data.address || null } });
  });
  redirect(formData.get('destination') === 'hours' ? '/online-presence/marketplace-profile/working-hours' : '/online-presence/marketplace-profile');
}
