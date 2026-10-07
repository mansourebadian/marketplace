// src/actions/onboarding.actions.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { TEAM_SIZES } from '@/lib/team-sizes';

const BusinessNameSchema = z.object({
  businessName: z
    .string()
    .min(1, 'نام کسب‌وکار الزامی است')
    .max(100, 'نام کسب‌وکار نباید بیش از ۱۰۰ کاراکتر باشد')
    .regex(/^[^\x00-\x1F\x7F]+$/, 'نام کسب‌وکار شامل کاراکترهای غیرمجاز است'),
  website: z
    .string()
    .max(255, 'آدرس وب‌سایت نباید بیش از ۲۵۵ کاراکتر باشد')
    .refine(
      (val: string) => {
        if (!val) return true;
        try {
          new URL(val.startsWith('http') ? val : `https://${val}`);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'آدرس وب‌سایت معتبر نیست' }
    )
    .optional()
    .or(z.literal('')),
});

export interface OnboardingBusinessNameState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  fieldErrors?: {
    businessName?: string;
    website?: string;
  };
}

export async function saveBusinessName(
  _prev: OnboardingBusinessNameState,
  formData: FormData
): Promise<OnboardingBusinessNameState> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== 'OWNER') {
    return { status: 'error', message: 'دسترسی غیرمجاز' };
  }

  const raw = {
    businessName: formData.get('businessName')?.toString().trim() ?? '',
    website: formData.get('website')?.toString().trim() ?? '',
  };

  const parsed = BusinessNameSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: OnboardingBusinessNameState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { status: 'error', fieldErrors };
  }

  try {
    await prisma.business.upsert({
      where: { ownerId: session.user.id },
      create: {
        ownerId: session.user.id,
        name: parsed.data.businessName,
        website: parsed.data.website || null,
      },
      update: {
        name: parsed.data.businessName,
        website: parsed.data.website || null,
      },
    });
  } catch (error) {
    console.error('Failed to save business name:', error);
    return {
      status: 'error',
      message: 'خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.',
    };
  }

  redirect('/onboarding/business-category');
}

export interface OnboardingCategoriesState {
  status: 'idle' | 'error' | 'success';
  message?: string;
  otherServiceError?: string;
}

const CategoriesSchema = z.array(z.string().refine(
  (slug) => BUSINESS_CATEGORIES.some((category) => category.slug === slug),
  'دسته‌بندی انتخاب‌شده معتبر نیست.'
)).min(1, 'حداقل یک دسته‌بندی انتخاب کنید.').max(4, 'حداکثر چهار دسته‌بندی انتخاب کنید.')
  .refine((slugs) => new Set(slugs).size === slugs.length, 'دسته‌بندی تکراری مجاز نیست.');

export async function saveBusinessCategories(
  _prev: OnboardingCategoriesState,
  formData: FormData,
): Promise<OnboardingCategoriesState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') {
    return { status: 'error', message: 'دسترسی غیرمجاز' };
  }
  const parsed = CategoriesSchema.safeParse(formData.getAll('categories'));
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0].message };
  }
  const otherService = parsed.data.includes('other')
    ? z.string().trim().min(1, 'نام سرویس دیگر را وارد کنید.')
      .max(100, 'نام سرویس نباید بیش از ۱۰۰ کاراکتر باشد.')
      .regex(/^[^\x00-\x1F\x7F]+$/, 'نام سرویس شامل کاراکترهای غیرمجاز است.')
      .safeParse(formData.get('otherServiceName'))
    : null;
  if (otherService && !otherService.success) {
    return { status: 'error', otherServiceError: otherService.error.issues[0].message };
  }
  try {
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id }, select: { id: true },
    });
    if (!business) return { status: 'error', message: 'ابتدا نام کسب‌وکار را ثبت کنید.' };
    await prisma.business.update({
      where: { id: business.id },
      data: { categories: {
        deleteMany: {},
        create: parsed.data.map((slug, position) => ({
          slug, position,
          customName: slug === 'other' && otherService?.success ? otherService.data : null,
        })),
      } },
    });
  } catch (error) {
    console.error('Failed to save business categories:', error);
    return { status: 'error', message: 'ذخیره دسته‌بندی‌ها انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/onboarding/business-category');
  redirect('/onboarding/team');
}

export interface OnboardingTeamState {
  status: 'idle' | 'error' | 'success';
  message?: string;
}

export async function saveTeamSize(
  _prev: OnboardingTeamState,
  formData: FormData,
): Promise<OnboardingTeamState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') {
    return { status: 'error', message: 'دسترسی غیرمجاز' };
  }
  const parsed = z.string().refine(
    (value) => TEAM_SIZES.some((size) => size.value === value),
    'اندازه تیم خود را انتخاب کنید.',
  ).safeParse(formData.get('teamSize'));
  if (!parsed.success) return { status: 'error', message: 'اندازه تیم خود را انتخاب کنید.' };
  try {
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true, categories: { select: { id: true }, take: 1 } },
    });
    if (!business || business.categories.length === 0) {
      return { status: 'error', message: 'ابتدا دسته‌بندی کسب‌وکار خود را ثبت کنید.' };
    }
    await prisma.business.update({
      where: { id: business.id }, data: { teamSize: parsed.data },
    });
  } catch (error) {
    console.error('Failed to save team size:', error);
    return { status: 'error', message: 'ذخیره اندازه تیم انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/onboarding/team');
  return { status: 'success', message: 'اندازه تیم شما ذخیره شد.' };
}
