import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const bundleSchema = z.object({
  name: z.string().trim().min(1, 'نام بسته را وارد کنید.').max(255),
  categoryKey: z.string().min(1).max(72),
  description: z.string().trim().max(1000),
  scheduleType: z.enum(['sequence', 'parallel']),
  priceType: z.enum(['services', 'custom', 'discount', 'free']),
  customPrice: z.number().int().min(0).max(2147483647).nullable(),
  discount: z.number().int().min(0).max(100).nullable(),
  onlineBooking: z.boolean(),
  availability: z.enum(['all', 'women', 'men']),
  serviceIds: z.array(z.string().min(1).max(36)).min(1, 'حداقل یک خدمت انتخاب کنید.').max(100),
});

export async function createBusinessBundle(input: unknown, imageNames: string[] = [], edit?: { id: string; retainedImageIds: string[] }): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی غیرمجاز است.' };
  const parsed = bundleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'اطلاعات بسته معتبر نیست.' };
  const data = parsed.data;
  if (imageNames.length > 20 || imageNames.some(name => !/^[0-9a-f-]{36}\.(?:jpg|png|webp|avif)$/i.test(name))) return { error: 'تصاویر بسته معتبر نیستند.' };
  if (new Set(data.serviceIds).size !== data.serviceIds.length) return { error: 'خدمات تکراری انتخاب شده‌اند.' };
  if (data.priceType === 'custom' && data.customPrice === null) return { error: 'قیمت بسته را وارد کنید.' };
  if (data.priceType === 'discount' && data.discount === null) return { error: 'درصد تخفیف را وارد کنید.' };
  try {
    const result = await prisma.$transaction(async tx => {
      const business = await tx.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
      if (!business) return 'کسب‌وکار پیدا نشد.';
      const category = data.categoryKey.startsWith('default:')
        ? await tx.businessCategorySelection.findFirst({ where: { businessId: business.id, slug: data.categoryKey.slice(8) }, select: { id: true } })
        : data.categoryKey.startsWith('custom:')
          ? await tx.businessServiceCategory.findFirst({ where: { businessId: business.id, id: data.categoryKey.slice(7) }, select: { id: true } })
          : null;
      if (!category) return 'دسته‌بندی پیدا نشد.';
      const services = await tx.businessService.findMany({ where: { businessId: business.id, categoryKey: data.categoryKey, id: { in: data.serviceIds } }, select: { id: true, price: true } });
      if (services.length !== data.serviceIds.length) return 'خدمات انتخاب‌شده باید متعلق به دسته‌بندی بسته باشند.';
      const total = services.reduce((sum, service) => sum + service.price, 0);
      if (!Number.isSafeInteger(total) || total > 2147483647) return 'مجموع قیمت خدمات بیش از حد مجاز است.';
      if (total === 0 && (data.priceType === 'custom' || data.priceType === 'discount')) return 'برای خدمات رایگان نمی‌توان قیمت دلخواه یا تخفیف تعیین کرد.';
      const price = data.priceType === 'free' ? 0 : data.priceType === 'custom' ? data.customPrice! : data.priceType === 'discount' ? Math.round(total * (100 - data.discount!) / 100) : total;
      const values = {
        businessId: business.id, categoryKey: data.categoryKey, name: data.name, description: data.description || null,
        scheduleType: data.scheduleType, priceType: data.priceType, price, discount: data.priceType === 'discount' ? data.discount : null,
        onlineBooking: data.onlineBooking, availability: data.availability,
      };
      if (edit) {
        const existing = await tx.businessBundle.findFirst({ where: { id: edit.id, businessId: business.id }, select: { images: { orderBy: { position: 'asc' }, select: { id: true, url: true } } } });
        if (!existing || new Set(edit.retainedImageIds).size !== edit.retainedImageIds.length || edit.retainedImageIds.some(id => !existing.images.some(image => image.id === id))) return 'بسته یا تصاویر آن پیدا نشد.';
        const retained = existing.images.filter(image => edit.retainedImageIds.includes(image.id)).map(image => image.url);
        if (retained.length + imageNames.length > 20) return 'حداکثر ۲۰ تصویر مجاز است.';
        await tx.businessBundleItem.deleteMany({ where: { bundleId: edit.id } });
        await tx.businessBundleImage.deleteMany({ where: { bundleId: edit.id } });
        await tx.businessBundle.update({ where: { id: edit.id }, data: { ...values, items: { create: data.serviceIds.map((serviceId, position) => ({ serviceId, position })) }, images: { create: [...retained, ...imageNames].map((url, position) => ({ url, position })) } } });
      } else await tx.businessBundle.create({ data: { ...values, items: { create: data.serviceIds.map((serviceId, position) => ({ serviceId, position })) }, images: { create: imageNames.map((url, position) => ({ url, position })) } } });
      return null;
    }, { isolationLevel: 'Serializable' });
    if (result) return { error: result };
  } catch (error) {
    console.error('Failed to create bundle', error);
    return { error: 'ذخیره بسته انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/catalogue/services');
  return {};
}
