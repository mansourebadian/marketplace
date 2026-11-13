import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AddTeamMember } from '../../add/team-member-form';

export const metadata: Metadata = { title: 'ویرایش عضو تیم | آرینو' };

export default async function EditTeamMemberPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ section?: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const { id } = await params;
  const initialSection = (await searchParams).section === 'services' ? 'services' : 'profile';
  if (id === 'owner') {
    const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, include: { owner: true } });
    if (!business) notFound();
    const owner = business.owner;
    const names = (owner.name || business.name).trim().split(/\s+/);
    return <AddTeamMember initialSection={initialSection} member={{ id: 'owner', firstName: owner.firstName || names[0], lastName: owner.lastName || names.slice(1).join(' ') || null, email: owner.email.endsWith('@phone.invalid') ? '' : owner.email, phone: owner.phone, country: owner.country, birthday: owner.dateOfBirth?.toISOString().slice(0, 10) || null, gender: owner.gender, additionalPhone: null, pronouns: null, color: '#9de6f3', jobTitle: null, startDate: null, endDate: null, employmentType: null, externalId: null, notes: null, imageName: null }} />;
  }
  const member = await prisma.businessTeamMember.findFirst({ where: { id, business: { ownerId: session.user.id } } });
  if (!member) notFound();
  const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? null;
  return <AddTeamMember initialSection={initialSection} member={{ ...member, birthday: date(member.birthday), startDate: date(member.startDate), endDate: date(member.endDate) }} />;
}
