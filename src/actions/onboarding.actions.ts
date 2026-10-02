// src/actions/onboarding.actions.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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
  status: 'idle' | 'error';
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
  // ← await اضافه شد
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
    // ← await اضافه شد
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
  } catch {
    return {
      status: 'error',
      message: 'خطا در ذخیره اطلاعات. لطفاً دوباره تلاش کنید.',
    };
  }

  redirect('/onboarding/business-category');
}
