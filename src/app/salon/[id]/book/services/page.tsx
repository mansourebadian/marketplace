import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { formatBusinessAddress } from '@/lib/business-address';
import { ServiceSelection } from '@/components/features/ServiceSelection';

export default async function ServicesPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string; step?: string; services?: string; slot?: string }>;
}) {
  const session = await auth();
  const customer = session?.user?.id && session.user.role === 'CUSTOMER' ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { accounts: { where: { provider: 'phone' }, select: { id: true }, take: 1 } } }) : null;
  const { id } = await params;
  const { source, step, services: selectedParam, slot } = await searchParams;
  const salon = source === 'business' ? null : await prisma.salon.findUnique({
    where: { id },
    select: {
      name: true, address: true, imageUrl: true,
      portfolio: { orderBy: { order: 'asc' }, take: 1, select: { imageUrl: true } },
      reviews: { select: { rating: true } },
      services: { select: { id: true, name: true, price: true, durationMin: true, category: { select: { id: true, name: true } } } },
    },
  });
  const business = salon ? null : await prisma.business.findFirst({
    where: { id, businessAddress: { not: null } },
    select: {
      name: true, businessAddress: true, businessLocation: true,
      services: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], select: { id: true, name: true, description: true, price: true, priceType: true, durationMin: true, categoryKey: true } },
      categories: { select: { slug: true, displayName: true, customName: true } },
      serviceCategories: { select: { id: true, name: true } },
    },
  });
  if (!salon && !business) notFound();
  const categories = new Map<string, string>();
  business?.categories.forEach((category) => categories.set(`default:${category.slug}`, category.displayName || category.customName || BUSINESS_CATEGORIES.find((item) => item.slug === category.slug)?.label || 'سایر خدمات'));
  business?.serviceCategories.forEach((category) => categories.set(`custom:${category.id}`, category.name));
  const services = salon ? salon.services.map((service) => ({
    id: service.id, name: service.name, description: null, price: service.price, priceType: 'FIXED', durationMin: service.durationMin,
    categoryId: service.category?.id || 'other', categoryName: service.category?.name || 'سایر خدمات',
  })) : business!.services.map((service) => ({
    id: service.id, name: service.name, description: service.description, price: service.price, priceType: service.priceType, durationMin: service.durationMin,
    categoryId: service.categoryKey, categoryName: categories.get(service.categoryKey) || 'سایر خدمات',
  }));
  const suffix = source === 'business' ? '?source=business' : '';
  const base = `/salon/${encodeURIComponent(id)}`;
  const reviews = salon?.reviews || [];
  return <ServiceSelection
    businessId={business ? id : null}
    testPaymentsEnabled={process.env.NODE_ENV === 'development' && process.env.BOOKING_TEST_PAYMENTS === '1'}
    customerHasPhone={Boolean(customer?.accounts.length)}
    initialSlot={slot && /^\d{13}$/.test(slot) ? Number(slot) : null}
    salon={{ name: salon?.name || business!.name, address: salon ? salon.address : formatBusinessAddress(business!.businessAddress, business!.businessLocation) || 'آدرس ثبت نشده است', image: salon?.portfolio[0]?.imageUrl || salon?.imageUrl || null, rating: reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : null, reviewsCount: reviews.length }}
    services={services} backHref={`${base}/book${suffix}`} closeHref={`${base}${suffix}`}
    initialSelected={(selectedParam || '').split(',').filter((id) => services.some((service) => service.id === id))}
    step={step === 'time' ? 'time' : 'services'}
    servicesHref={`${base}/book/services${suffix}`}
  />;
}

