import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { WorkingHoursForm } from './working-hours-form';

export const metadata: Metadata = { title: 'ساعت‌های کاری | آرینو' };

export default async function WorkingHoursPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true, locations: { orderBy: { createdAt: 'asc' }, take: 1, select: { openingHours: { select: { day: true, enabled: true, opensAt: true, closesAt: true } } } } } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  let extra: Record<string, { opensAt?: unknown; closesAt?: unknown }> = {};
  try { const details = JSON.parse(business.businessAddress); if (details?.secondOpeningHours && typeof details.secondOpeningHours === 'object') extra = details.secondOpeningHours; } catch { /* Older addresses may be plain text. */ }
  const initialHours = (business.locations[0]?.openingHours ?? []).map(hour => ({ ...hour, secondOpensAt: typeof extra[hour.day]?.opensAt === 'string' ? extra[hour.day].opensAt as string : null, secondClosesAt: typeof extra[hour.day]?.closesAt === 'string' ? extra[hour.day].closesAt as string : null }));
  return <WorkingHoursForm initialHours={initialHours} />;
}
