import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ServiceLocationForm } from '@/components/features/onboarding/ServiceLocationForm';
export default async function BusinessLocationPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { serviceLocation: true, teamSize: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.teamSize) redirect('/onboarding/team');
  return <ServiceLocationForm initialLocation={business.serviceLocation ?? ''} />;
}
