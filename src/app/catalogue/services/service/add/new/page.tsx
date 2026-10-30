import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { ServiceForm } from '@/components/features/catalogue/ServiceForm';

export const metadata: Metadata = { title: 'افزودن خدمت | فرشا' };

export default async function AddServicePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const { category } = await searchParams;
  if (typeof category !== 'string' || category.length > 72) redirect('/catalogue/services');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, businessAddress: true, locations: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true } } } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  let categoryName: string | undefined;
  if (category.startsWith('custom:')) {
    const selected = await prisma.businessServiceCategory.findFirst({ where: { id: category.slice(7), businessId: business.id }, select: { name: true } });
    categoryName = selected?.name;
  } else if (category.startsWith('default:')) {
    const slug = category.slice(8);
    const selected = await prisma.businessCategorySelection.findFirst({ where: { slug, businessId: business.id }, select: { displayName: true, customName: true } });
    if (selected) categoryName = selected.displayName || selected.customName || BUSINESS_CATEGORIES.find(item => item.slug === slug)?.label || slug;
  }
  if (!categoryName) redirect('/catalogue/services');
  return <ServiceForm categoryKey={category} categoryName={categoryName} locations={business.locations} />;
}
