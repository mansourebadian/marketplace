'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export type ServiceFormState = { error?: string };

const digits = (value: string) => value.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
const wholeNumber = (value: FormDataEntryValue | null) => typeof value === 'string' && /^\d+$/.test(digits(value.trim())) ? Number(digits(value.trim())) : NaN;
const extraTimesSchema = z.array(z.discriminatedUnion('type', [
  z.object({ type: z.literal('SERVICE') }),
  z.object({ type: z.enum(['PROCESSING', 'BLOCKED', 'EXTRA_SERVICE']), minutes: z.number().int().min(5).max(720) }),
])).max(21).refine(rows => rows.filter(row => row.type === 'SERVICE').length <= 1 && rows.filter(row => row.type !== 'SERVICE').length <= 20, 'زمان اضافی معتبر نیست.');
const variantsSchema = z.array(z.object({
  name: z.string().trim().max(50), description: z.string().trim().max(200), sku: z.string().trim().max(20).default(''),
  priceType: z.enum(['FREE', 'STARTS_AT', 'FIXED']), price: z.number().int().min(0).max(2147483647),
  durationMin: z.number().int().min(5).max(720),
  extraTimes: z.array(z.object({ type: z.enum(['PROCESSING', 'BLOCKED', 'EXTRA_SERVICE']), minutes: z.number().int().min(5).max(720) })).max(20),
}).refine(variant => variant.priceType !== 'FREE' || variant.price === 0)).max(20);
const advancedPricingSchema = z.array(z.object({
  locationId: z.string().min(1).max(36), durationMin: z.number().int().min(5).max(720).nullable(),
  priceType: z.enum(['FREE', 'STARTS_AT', 'FIXED']).nullable(), price: z.number().int().min(0).max(2147483647).nullable(),
}).refine(row => row.priceType !== 'FREE' || row.price === null)).max(100).refine(rows => new Set(rows.map(row => row.locationId)).size === rows.length, 'تنظیمات شعبه معتبر نیست.');

export async function createBusinessService(_previous: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی غیرمجاز است.' };
  let extraTimes: unknown;
  let variants: unknown;
  let advancedPricing: unknown;
  try {
    const value = formData.get('extraTimes');
    if (typeof value !== 'string' || value.length > 4000) throw new Error('Invalid extra times');
    extraTimes = JSON.parse(value);
    const variantValue = formData.get('variants');
    if (typeof variantValue !== 'string' || variantValue.length > 15000) throw new Error('Invalid variants');
    variants = JSON.parse(variantValue);
    const pricingValue = formData.get('advancedPricing');
    if (typeof pricingValue !== 'string' || pricingValue.length > 20000) throw new Error('Invalid advanced pricing');
    advancedPricing = JSON.parse(pricingValue);
  } catch {
    return { error: 'زمان اضافی معتبر نیست.' };
  }
  const parsed = z.object({
    categoryKey: z.string().min(1).max(72).refine(value => value.startsWith('default:') || value.startsWith('custom:')),
    name: z.string().trim().min(1, 'نام خدمت را وارد کنید.').max(255),
    description: z.string().trim().max(1000),
    treatmentTypeId: z.string().max(120),
    priceType: z.enum(['FREE', 'STARTS_AT', 'FIXED'], { error: 'نوع قیمت معتبر انتخاب کنید.' }),
    price: z.number({ error: 'قیمت معتبر وارد کنید.' }).int('قیمت باید عدد صحیح باشد.').min(0, 'قیمت معتبر وارد کنید.').max(2147483647, 'قیمت بیش از حد مجاز است.'),
    durationMin: z.number({ error: 'مدت زمان معتبر انتخاب کنید.' }).int().min(1).max(1440),
    extraTimes: extraTimesSchema,
    variants: variantsSchema,
    advancedPricing: advancedPricingSchema,
  }).safeParse({ categoryKey: formData.get('categoryKey'), name: formData.get('name'), description: formData.get('description'), treatmentTypeId: formData.get('treatmentTypeId'), priceType: formData.get('priceType'), price: formData.get('priceType') === 'FREE' ? 0 : wholeNumber(formData.get('price')), durationMin: wholeNumber(formData.get('durationMin')), extraTimes, variants, advancedPricing });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'اطلاعات خدمت معتبر نیست.' };
  if (parsed.data.advancedPricing.some(row => (row.priceType ?? parsed.data.priceType) === 'FREE' && row.price !== null)) return { error: 'برای خدمت رایگان نمی‌توان قیمت ثبت کرد.' };

  const { categoryKey, name, description, treatmentTypeId, priceType, price, durationMin } = parsed.data;
  try {
    const created = await prisma.$transaction(async tx => {
      const business = await tx.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
      if (!business) return false;
      const category = categoryKey.startsWith('custom:')
        ? await tx.businessServiceCategory.findFirst({ where: { id: categoryKey.slice(7), businessId: business.id }, select: { id: true } })
        : await tx.businessCategorySelection.findFirst({ where: { slug: categoryKey.slice(8), businessId: business.id }, select: { id: true } });
      if (!category) return false;
      if (treatmentTypeId && !(await tx.treatmentType.findUnique({ where: { id: treatmentTypeId }, select: { id: true } }))) return false;
      if (parsed.data.advancedPricing.length && await tx.businessLocation.count({ where: { businessId: business.id, id: { in: parsed.data.advancedPricing.map(row => row.locationId) } } }) !== parsed.data.advancedPricing.length) return false;
      await tx.businessService.create({ data: { businessId: business.id, categoryKey, name, description: description || null, treatmentTypeId: treatmentTypeId || null, priceType, price, durationMin, extraTimes: JSON.stringify(parsed.data.extraTimes), variants: JSON.stringify(parsed.data.variants), advancedPricing: JSON.stringify(parsed.data.advancedPricing) } });
      return true;
    }, { isolationLevel: 'Serializable' });
    if (!created) return { error: 'دسته‌بندی یا نوع خدمت پیدا نشد. لطفاً دوباره تلاش کنید.' };
  } catch (error) {
    console.error('Failed to create business service', error);
    return { error: 'ذخیرهٔ خدمت انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/catalogue/services');
  redirect('/catalogue/services');
}
