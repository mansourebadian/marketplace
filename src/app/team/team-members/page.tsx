import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import { TeamMembers } from './team-members';

export const metadata: Metadata = { title: 'اعضای تیم | آرینو' };

export default async function TeamMembersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, businessAddress: true, owner: { select: { name: true, email: true, phone: true } }, locations: { select: { id: true, name: true, address: true }, orderBy: { createdAt: 'asc' } }, teamMembers: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, imageName: true, permissionRole: true, country: true, birthday: true, gender: true, pronouns: true, color: true, jobTitle: true, startDate: true, endDate: true, employmentType: true, externalId: true }, orderBy: { createdAt: 'asc' } } },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  const ownerName = business.owner.name || business.name;
  return <BusinessWorkspace ownerName={ownerName} activePage="/team/team-members" label="اعضای تیم">
    <TeamMembers ownerName={ownerName} ownerEmail={business.owner.email.endsWith('@phone.invalid') ? '' : business.owner.email} ownerPhone={business.owner.phone} locations={business.locations} teamMembers={business.teamMembers} />
  </BusinessWorkspace>;
}
