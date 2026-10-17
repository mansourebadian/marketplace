import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BusinessAddressForm } from '@/components/features/onboarding/BusinessAddressForm';
export default async function BusinessAddressPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessLocation: true, businessAddress: true, serviceLocation: true, previousSoftware: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.serviceLocation) redirect('/onboarding/business-location');
  const requiresSoftware = !business.serviceLocation.includes('PHYSICAL_LOCATION');
  if (requiresSoftware && !business.previousSoftware) redirect('/onboarding/previous-software');
  return <BusinessAddressForm initialLocation={business.businessLocation ?? ''} initialAddress={business.businessAddress ?? ''} backHref={requiresSoftware ? '/onboarding/previous-software' : '/onboarding/business-location'} />;
}
