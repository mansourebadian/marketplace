import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { formatBusinessAddress } from '@/lib/business-address';
import { RepeatingForm } from './repeating-form';

export default async function RepeatingPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const { member } = await searchParams;
  if (!member) notFound();
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, name: true, businessAddress: true, owner: { select: { name: true } }, teamMembers: { where: { id: member }, select: { firstName: true, lastName: true } }, recurringShifts: { where: { memberKey: member }, orderBy: { startDate: 'desc' }, take: 1, select: { startDate: true, endDate: true, interval: true, days: true } } } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const person = member === 'owner' ? business.owner.name || business.name : business.teamMembers[0] && [business.teamMembers[0].firstName, business.teamMembers[0].lastName].filter(Boolean).join(' ');
  if (!person) notFound();
  return <RepeatingForm memberKey={member} memberName={person} businessName={business.name} businessAddress={formatBusinessAddress(business.businessAddress, null) || 'آدرس ثبت نشده است'} initial={business.recurringShifts[0] || null} />;
}
