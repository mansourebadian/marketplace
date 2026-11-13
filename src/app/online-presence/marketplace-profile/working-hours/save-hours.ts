'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const hoursSchema = z.array(z.object({ day: z.number().int().min(0).max(6), enabled: z.boolean(), opensAt: time, closesAt: time, secondOpensAt: time.nullable(), secondClosesAt: time.nullable() }).refine(value => (value.secondOpensAt === null) === (value.secondClosesAt === null) && (!value.enabled || (value.opensAt < value.closesAt && (!value.secondOpensAt || (value.secondClosesAt !== null && value.closesAt <= value.secondOpensAt && value.secondOpensAt < value.secondClosesAt)))))).length(7).refine(values => new Set(values.map(value => value.day)).size === 7);

export async function saveHours(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const hours = hoursSchema.parse(JSON.parse(String(formData.get('hours'))));
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, name: true, businessAddress: true, locations: { orderBy: { createdAt: 'asc' }, take: 1, select: { id: true } } } });
  if (!business) redirect('/onboarding/business-name');
  let details: Record<string, unknown> = {};
  try { const parsed: unknown = JSON.parse(business.businessAddress || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) details = parsed as Record<string, unknown>; } catch { /* Older addresses may be plain text. */ }
  const secondOpeningHours = Object.fromEntries(hours.filter(value => value.secondOpensAt && value.secondClosesAt).map(value => [value.day, { opensAt: value.secondOpensAt, closesAt: value.secondClosesAt }]));
  const address = JSON.stringify({ ...details, secondOpeningHours });
  if (address.length > 1200) throw new Error('Address details exceed the storage limit');
  await prisma.$transaction(async tx => {
    const location = business.locations[0] ?? await tx.businessLocation.create({ data: { businessId: business.id, name: business.name.slice(0, 60) }, select: { id: true } });
    for (const value of hours) { const data = { enabled: value.enabled, opensAt: value.opensAt, closesAt: value.closesAt }; await tx.locationOpeningHour.upsert({ where: { locationId_day: { locationId: location.id, day: value.day } }, create: { locationId: location.id, day: value.day, ...data }, update: data, select: { id: true } }); }
    await tx.business.update({ where: { id: business.id }, data: { businessAddress: address } });
  });
  redirect(formData.get('destination') === 'showcase' ? '/online-presence/marketplace-profile/showcase-overview' : '/online-presence/marketplace-profile');
}
