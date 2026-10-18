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
  redirect('/onboarding/business-location');
}

export interface OnboardingServiceLocationState { status: 'idle' | 'error' | 'success'; message?: string; }
const SERVICE_LOCATIONS = ['PHYSICAL_LOCATION', 'MOBILE_OPERATOR', 'VIRTUAL_ONLINE'] as const;

export async function saveServiceLocation(_prev: OnboardingServiceLocationState, formData: FormData): Promise<OnboardingServiceLocationState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { status: 'error', message: 'دسترسی غیرمجاز' };
  const locations = formData.getAll('serviceLocation').map((value) => value.toString());
  if (!locations.length || locations.some((location) => !SERVICE_LOCATIONS.includes(location as (typeof SERVICE_LOCATIONS)[number]))) return { status: 'error', message: 'حداقل یک محل ارائه خدمات را انتخاب کنید.' };
  try {
    await prisma.business.update({ where: { ownerId: session.user.id }, data: { serviceLocation: JSON.stringify(locations) } });
  } catch (error) {
    console.error('Failed to save service location:', error);
    return { status: 'error', message: 'ذخیره محل ارائه خدمات انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/onboarding/business-location');
  if (locations.includes('PHYSICAL_LOCATION')) redirect('/onboarding/business-address');
  redirect('/onboarding/previous-software');
}

export interface PreviousSoftwareState { status: 'idle' | 'error' | 'success'; message?: string; }
const PREVIOUS_SOFTWARE = ['ACUITY', 'BOOKSY', 'CALENDLY', 'GOLDIE', 'JANEAPP', 'MINDBODY', 'SALON_IRIS', 'SETMORE', 'SHORTCUTS', 'SQUARE', 'STYLESEAT', 'TIMELY', 'TREATWELL', 'VAGARO', 'ZENOTI', 'NONE', 'OTHER'] as const;

export async function savePreviousSoftware(_prev: PreviousSoftwareState, formData: FormData): Promise<PreviousSoftwareState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { status: 'error', message: 'دسترسی غیرمجاز' };
  const software = formData.get('previousSoftware')?.toString() ?? '';
  if (!PREVIOUS_SOFTWARE.includes(software as (typeof PREVIOUS_SOFTWARE)[number])) return { status: 'error', message: 'لطفاً یک گزینه را انتخاب کنید.' };
  try { await prisma.business.update({ where: { ownerId: session.user.id }, data: { previousSoftware: software } }); }
  catch (error) { console.error('Failed to save previous software:', error); return { status: 'error', message: 'ذخیره انتخاب انجام نشد. دوباره تلاش کنید.' }; }
  revalidatePath('/onboarding/previous-software');
  redirect('/onboarding/business-address');
}

export async function saveBusinessLocation(_prev: OnboardingServiceLocationState, formData: FormData): Promise<OnboardingServiceLocationState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { status: 'error', message: 'دسترسی غیرمجاز' };
  const location = formData.get('businessLocation')?.toString().trim() ?? '';
  const addressDetails = formData.get('addressDetails')?.toString() ?? '';
  let validatedAddress: string;
  try {
    const details = z.object({
      address: z.string().max(300), unit: z.string().max(100), district: z.string().max(100),
      postalCode: z.string().max(20), directions: z.string().max(200),
      province: z.string().max(100).optional(), country: z.string().max(100).optional(),
      point: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
    }).parse(JSON.parse(addressDetails));
    validatedAddress = JSON.stringify(details);
    if (validatedAddress.length > 1200) throw new Error('Address too long');
  } catch {
    return { status: 'error', message: 'موقعیت دقیق را روی نقشه انتخاب کنید و طول جزئیات آدرس را بررسی کنید.' };
  }
  if (location.length < 2) return { status: 'error', message: 'لطفاً شهر محل کسب‌وکار را انتخاب کنید.' };
  try {
    await prisma.business.update({ where: { ownerId: session.user.id }, data: { businessLocation: location, businessAddress: validatedAddress } });
  } catch (error) {
    console.error('Failed to save business location:', error);
    return { status: 'error', message: 'ذخیره آدرس کسب‌وکار انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/onboarding/business-address');
  redirect('/onboarding/complete');
}
