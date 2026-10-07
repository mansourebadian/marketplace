import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { TeamSizeForm } from '@/components/features/onboarding/TeamSizeForm';

export default async function TeamSizePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { teamSize: true, categories: { select: { id: true }, take: 1 } },
  });
  if (!business) redirect('/onboarding/business-name');
  if (business.categories.length === 0) redirect('/onboarding/business-category');
  return <TeamSizeForm initialTeamSize={business.teamSize ?? ''} />;
}
