import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import { ServiceMenu } from '@/components/features/catalogue/ServiceMenu';

export const metadata: Metadata = { title: 'فهرست خدمات | فرشا' };

export default async function ServiceMenuPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, businessAddress: true, categories: { orderBy: { position: 'asc' }, select: { slug: true, customName: true, displayName: true, description: true } }, serviceCategories: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true, description: true } } },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  const specialties = business.categories.map(({ slug, customName, displayName, description }) => ({
    slug,
    name: displayName || (slug === 'other' && customName) || BUSINESS_CATEGORIES.find(category => category.slug === slug)?.label || slug,
    description,
  }));

  const categories = [
    ...business.serviceCategories.map(category => ({ slug: `custom:${category.id}`, name: category.name, description: category.description })),
    ...specialties,
  ];

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/catalogue/services" label="فهرست خدمات کسب‌وکار">
    <ServiceMenu categories={categories} />
  </BusinessWorkspace>;
}
