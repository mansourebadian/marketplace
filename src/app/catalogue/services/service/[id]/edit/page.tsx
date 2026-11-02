import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { ServiceForm, type InitialService } from '@/components/features/catalogue/ServiceForm';

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const { id } = await params;
  if (!id || id.length > 36) notFound();
  const service = await prisma.businessService.findFirst({ where: { id, business: { ownerId: session.user.id } }, include: { treatmentType: { select: { id: true, name: true, groupSlug: true, groupName: true } }, business: { select: { locations: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true } } } } } });
  if (!service) notFound();
  const key = service.categoryKey;
  const custom = key.startsWith('custom:') ? await prisma.businessServiceCategory.findFirst({ where: { id: key.slice(7), businessId: service.businessId }, select: { name: true } }) : null;
  const slug = key.startsWith('default:') ? key.slice(8) : '';
  const category = slug ? await prisma.businessCategorySelection.findFirst({ where: { slug, businessId: service.businessId }, select: { displayName: true, customName: true } }) : null;
  const categoryName = custom?.name || (category && (category.displayName || category.customName || BUSINESS_CATEGORIES.find(item => item.slug === slug)?.label || slug));
  if (!categoryName) notFound();
  let initial: InitialService;
  try {
    const extraTimes = JSON.parse(service.extraTimes);
    const variants = JSON.parse(service.variants);
    const advancedPricing = JSON.parse(service.advancedPricing);
    if (![extraTimes, variants, advancedPricing].every(Array.isArray)) throw new Error('Invalid service data');
    initial = { id: service.id, name: service.name, description: service.description, price: service.price, priceType: service.priceType, durationMin: service.durationMin, treatmentType: service.treatmentType, extraTimes, variants, advancedPricing };
  } catch { return <p dir="rtl">اطلاعات ذخیره‌شدهٔ خدمت قابل خواندن نیست. لطفاً با پشتیبانی تماس بگیرید.</p>; }
  return <ServiceForm categoryKey={key} categoryName={categoryName} locations={service.business.locations} initial={initial} />;
}
