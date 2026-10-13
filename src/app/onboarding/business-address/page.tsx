import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BusinessAddressForm } from '@/components/features/onboarding/BusinessAddressForm';
export default async function BusinessAddressPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessLocation: true, businessAddress: true, serviceLocation: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.serviceLocation?.includes('PHYSICAL_LOCATION')) redirect('/onboarding/business-location');
  return <BusinessAddressForm initialLocation={business.businessLocation ?? ''} initialAddress={business.businessAddress ?? ''} />;
}
