import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { LocationsPage } from '@/components/features/settings/LocationsPage';

export const metadata: Metadata = { title: 'موقعیت‌ها | فرشا' };

export default async function LocationsRoute() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, businessAddress: true, businessLocation: true },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  return <LocationsPage ownerName={session.user.name || business.name} businessName={business.name} address={business.businessAddress} location={business.businessLocation} />;
}
