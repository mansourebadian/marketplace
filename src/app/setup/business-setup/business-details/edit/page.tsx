import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessDetailsEdit } from '@/components/features/settings/BusinessDetailsEdit';

export const metadata: Metadata = { title: 'ویرایش جزئیات کسب‌وکار | فرشا' };

export default async function BusinessDetailsEditPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { name: true, website: true, taxMode: true, teamLanguage: true, clientLanguage: true, rubika: true, instagram: true, bale: true } });
  if (!business) redirect('/onboarding/business-name');
  return <BusinessDetailsEdit initialName={business.name} initialWebsite={business.website ?? ''} initialTaxMode={business.taxMode ?? 'include'} initialTeamLanguage={business.teamLanguage ?? 'فارسی'} initialClientLanguage={business.clientLanguage ?? 'فارسی'} initialRubika={business.rubika ?? ''} initialInstagram={business.instagram ?? ''} initialBale={business.bale ?? ''} />;
}
