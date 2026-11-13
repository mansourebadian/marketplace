import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { featureIds } from './options';
import FeaturesForm from './features-form';

export const metadata: Metadata = { title: 'ویژگی‌های کسب‌وکار | آرینو' };

export default async function FeaturesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  let selected: string[] = [];
  try {
    const details = JSON.parse(business.businessAddress);
    if (typeof details.venueFeatures === 'number' && Number.isSafeInteger(details.venueFeatures) && details.venueFeatures >= 0) {
      selected = featureIds.filter((_, index) => Boolean(details.venueFeatures & (1 << index)));
    }
  } catch { /* Legacy addresses may be plain text. */ }
  return <FeaturesForm initialFeatures={selected} />;
}
