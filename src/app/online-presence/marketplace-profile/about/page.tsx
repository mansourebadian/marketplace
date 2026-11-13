import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getMarketplaceDescription } from '@/lib/marketplace-description';
import AboutForm from './about-form';

export const metadata: Metadata = { title: 'درباره کسب‌وکار | آرینو' };

export default async function AboutPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  return <AboutForm businessId={business.id} initialDescription={await getMarketplaceDescription(business.id)} />;
}
