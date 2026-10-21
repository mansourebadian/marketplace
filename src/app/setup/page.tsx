import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { WorkspaceSettings } from '@/components/features/settings/WorkspaceSettings';

export const metadata: Metadata = { title: 'تنظیمات فضای کاری | فرشا' };

export default async function SetupPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, businessAddress: true },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <WorkspaceSettings ownerName={session.user.name || business.name} businessName={business.name} />;
}
