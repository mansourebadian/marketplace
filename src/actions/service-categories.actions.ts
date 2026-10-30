'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { APPOINTMENT_COLORS } from '@/lib/appointment-colors';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'نام دسته‌بندی را وارد کنید.').max(100),
  color: z.string().refine(value => APPOINTMENT_COLORS.some(color => color.value === value), 'رنگ نوبت معتبر نیست.'),
  description: z.string().trim().max(255),
});

export async function addServiceCategory(formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی غیرمجاز است.' };
  const parsed = categorySchema.safeParse({ name: formData.get('name'), color: formData.get('color'), description: formData.get('description') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'اطلاعات واردشده معتبر نیست.' };
  try {
    const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
    if (!business) return { error: 'کسب‌وکار پیدا نشد.' };
    await prisma.businessServiceCategory.create({ data: { businessId: business.id, ...parsed.data, description: parsed.data.description || null } });
  } catch (error) {
    console.error('Failed to create service category', error);
    return { error: 'ذخیرهٔ دسته‌بندی انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/catalogue/services');
  return {};
}

export async function getServiceCategory(id: string): Promise<{ category?: { name: string; color: string; description: string | null }; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی غیرمجاز است.' };
  if (!z.string().min(1).max(72).safeParse(id).success) return { error: 'دسته‌بندی معتبر نیست.' };
  try {
    if (id.startsWith('default:')) {
      const slug = id.slice('default:'.length);
      const selection = await prisma.businessCategorySelection.findFirst({ where: { slug, business: { ownerId: session.user.id } }, select: { slug: true, customName: true, displayName: true, color: true, description: true } });
      if (!selection) return { error: 'دسته‌بندی پیدا نشد.' };
      return { category: { name: selection.displayName || selection.customName || BUSINESS_CATEGORIES.find(category => category.slug === slug)?.label || slug, color: selection.color, description: selection.description } };
    }
    if (!id.startsWith('custom:')) return { error: 'دسته‌بندی معتبر نیست.' };
    const category = await prisma.businessServiceCategory.findFirst({
      where: { id: id.slice('custom:'.length), business: { ownerId: session.user.id } },
      select: { name: true, color: true, description: true },
    });
    return category ? { category } : { error: 'دسته‌بندی پیدا نشد.' };
  } catch (error) {
    console.error('Failed to load service category', error);
    return { error: 'دریافت دسته‌بندی انجام نشد. دوباره تلاش کنید.' };
  }
}

export async function updateServiceCategory(id: string, formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی غیرمجاز است.' };
  if (!z.string().min(1).max(72).safeParse(id).success) return { error: 'دسته‌بندی معتبر نیست.' };
  const parsed = categorySchema.safeParse({ name: formData.get('name'), color: formData.get('color'), description: formData.get('description') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'اطلاعات واردشده معتبر نیست.' };
  try {
    const result = id.startsWith('default:')
      ? await prisma.businessCategorySelection.updateMany({ where: { slug: id.slice('default:'.length), business: { ownerId: session.user.id } }, data: { displayName: parsed.data.name, color: parsed.data.color, description: parsed.data.description || null } })
      : id.startsWith('custom:')
        ? await prisma.businessServiceCategory.updateMany({ where: { id: id.slice('custom:'.length), business: { ownerId: session.user.id } }, data: { ...parsed.data, description: parsed.data.description || null } })
        : null;
    if (!result?.count) return { error: 'دسته‌بندی پیدا نشد.' };
  } catch (error) {
    console.error('Failed to update service category', error);
    return { error: 'ذخیرهٔ دسته‌بندی انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/catalogue/services');
  return {};
}

export async function deleteServiceCategory(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'دسترسی غیرمجاز است.' };
  if (!z.string().min(1).max(72).safeParse(id).success) return { error: 'دسته‌بندی معتبر نیست.' };
  try {
    const deleted = await prisma.$transaction(async tx => {
      const business = await tx.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
      if (!business) return false;
      const category = id.startsWith('default:')
        ? await tx.businessCategorySelection.findFirst({ where: { slug: id.slice(8), businessId: business.id }, select: { id: true } })
        : id.startsWith('custom:')
          ? await tx.businessServiceCategory.findFirst({ where: { id: id.slice(7), businessId: business.id }, select: { id: true } })
          : null;
      if (!category) return false;
      await tx.businessService.deleteMany({ where: { businessId: business.id, categoryKey: id } });
      if (id.startsWith('default:')) await tx.businessCategorySelection.delete({ where: { id: category.id } });
      else await tx.businessServiceCategory.delete({ where: { id: category.id } });
      return true;
    }, { isolationLevel: 'Serializable' });
    if (!deleted) return { error: 'دسته‌بندی پیدا نشد.' };
  } catch (error) {
    console.error('Failed to delete service category', error);
    return { error: 'حذف دسته‌بندی انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/catalogue/services');
  return {};
}
