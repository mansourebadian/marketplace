import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { BundleForm, type InitialBundle } from '@/components/features/catalogue/BundleForm';

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const { id } = await params;
  if (!id || id.length > 36) notFound();
  const bundle = await prisma.businessBundle.findFirst({
    where: { id, business: { ownerId: session.user.id } },
    include: {
      items: { orderBy: { position: 'asc' }, select: { serviceId: true } },
      images: { orderBy: { position: 'asc' }, select: { id: true, url: true } },
      business: { select: {
        categories: { orderBy: { position: 'asc' }, select: { slug: true, customName: true, displayName: true, color: true } },
        serviceCategories: { orderBy: { createdAt: 'desc' }, select: { id: true, name: true, color: true } },
        services: { orderBy: { createdAt: 'asc' }, select: { id: true, categoryKey: true, name: true, price: true, priceType: true, durationMin: true } },
      } },
    },
  });
  if (!bundle) notFound();
  if (!['sequence', 'parallel'].includes(bundle.scheduleType) || !['services', 'custom', 'discount', 'free'].includes(bundle.priceType) || !['all', 'women', 'men'].includes(bundle.availability)) return <p dir="rtl">تنظیمات ذخیره‌شدهٔ بسته معتبر نیست.</p>;
  const categories = [
    ...bundle.business.serviceCategories.map(item => ({ key: `custom:${item.id}`, name: item.name, color: item.color })),
    ...bundle.business.categories.map(item => ({ key: `default:${item.slug}`, name: item.displayName || (item.slug === 'other' && item.customName) || BUSINESS_CATEGORIES.find(entry => entry.slug === item.slug)?.label || item.slug, color: item.color })),
  ];
  if (!categories.some(category => category.key === bundle.categoryKey)) notFound();
  const initial: InitialBundle = { id: bundle.id, name: bundle.name, description: bundle.description, categoryKey: bundle.categoryKey, scheduleType: bundle.scheduleType as InitialBundle['scheduleType'], priceType: bundle.priceType as InitialBundle['priceType'], price: bundle.price, discount: bundle.discount, onlineBooking: bundle.onlineBooking, availability: bundle.availability as InitialBundle['availability'], serviceIds: bundle.items.map(item => item.serviceId), images: bundle.images };
  return <BundleForm categories={categories} initialCategory={bundle.categoryKey} services={bundle.business.services} initial={initial} />;
}
