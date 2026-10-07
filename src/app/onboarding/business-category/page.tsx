import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BusinessCategoryForm } from '@/components/features/onboarding/BusinessCategoryForm';

export default async function BusinessCategoryPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { categories: { orderBy: { position: 'asc' }, select: { slug: true, customName: true } } },
  });
  if (!business) redirect('/onboarding/business-name');
  return <BusinessCategoryForm
    initialCategories={business.categories.map((category) => category.slug)}
    initialOtherServiceName={business.categories.find((category) => category.slug === 'other')?.customName ?? ''}
  />;
}
