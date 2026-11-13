import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { BundleForm } from '@/components/features/catalogue/BundleForm';

export const metadata: Metadata = { title: 'افزودن بسته | آرینو' };

export default async function AddBundlePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const { category } = await searchParams;
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: {
      businessAddress: true,
      categories: { orderBy: { position: 'asc' }, select: { slug: true, customName: true, displayName: true, color: true } },
      serviceCategories: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true, color: true } },
      services: { orderBy: { createdAt: 'asc' }, select: { id: true, categoryKey: true, name: true, price: true, priceType: true, durationMin: true } },
    },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const categories = [
    ...business.serviceCategories.map(item => ({ key: `custom:${item.id}`, name: item.name, color: item.color })),
    ...business.categories.map(item => ({ key: `default:${item.slug}`, name: item.displayName || (item.slug === 'other' && item.customName) || BUSINESS_CATEGORIES.find(entry => entry.slug === item.slug)?.label || item.slug, color: item.color })),
  ];
  if (typeof category !== 'string' || !categories.some(item => item.key === category)) redirect('/catalogue/services');
  return <BundleForm categories={categories} initialCategory={category} services={business.services} />;
}
