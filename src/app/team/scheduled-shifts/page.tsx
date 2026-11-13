import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import { ScheduledShifts } from './scheduled-shifts';

export const metadata: Metadata = { title: 'شیفت‌های برنامه‌ریزی‌شده | آرینو' };

export default async function ScheduledShiftsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: {
    name: true, businessAddress: true, owner: { select: { name: true } },
    teamMembers: { select: { id: true, firstName: true, lastName: true }, orderBy: { createdAt: 'asc' } },
    shifts: { select: { memberKey: true, date: true, startTime: true, endTime: true } },
    recurringShifts: { select: { memberKey: true, startDate: true, endDate: true, interval: true, days: true } },
  } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const ownerName = business.owner.name || business.name;
  const members = [{ id: 'owner', name: ownerName }, ...business.teamMembers.map(member => ({ id: member.id, name: [member.firstName, member.lastName].filter(Boolean).join(' ') }))];
  return <BusinessWorkspace ownerName={ownerName} activePage="/team/scheduled-shifts" label="شیفت‌های برنامه‌ریزی‌شده"><ScheduledShifts members={members} initialShifts={business.shifts} recurringShifts={business.recurringShifts} /></BusinessWorkspace>;
}
