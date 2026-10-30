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
    select: { name: true, businessAddress: true, categories: { orderBy: { position: 'asc' }, select: { slug: true, customName: true, displayName: true, description: true, color: true } }, serviceCategories: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true, description: true, color: true } }, services: { orderBy: { createdAt: 'asc' }, select: { id: true, categoryKey: true, name: true, price: true, priceType: true, durationMin: true, extraTimes: true } } },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  const specialties = business.categories.map(({ slug, customName, displayName, description, color }) => ({
    slug,
    name: displayName || (slug === 'other' && customName) || BUSINESS_CATEGORIES.find(category => category.slug === slug)?.label || slug,
    description,
    color,
  }));

  const categories = [
    ...business.serviceCategories.map(category => ({ slug: `custom:${category.id}`, name: category.name, description: category.description, color: category.color })),
    ...specialties,
  ];

  const services = business.services.map(service => {
    let includedMinutes = 0;
    try {
      const extraTimes: unknown = JSON.parse(service.extraTimes);
      if (Array.isArray(extraTimes)) includedMinutes = extraTimes.reduce((sum, item) => sum + (item && (item.type === 'PROCESSING' || item.type === 'EXTRA_SERVICE') && Number.isInteger(item.minutes) && item.minutes > 0 ? item.minutes : 0), 0);
    } catch { /* Keep the base duration if stored data is invalid. */ }
    return { ...service, durationMin: service.durationMin + includedMinutes };
  });

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/catalogue/services" label="فهرست خدمات کسب‌وکار">
    <ServiceMenu categories={categories} services={services} />
  </BusinessWorkspace>;
}
