'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  businessName: z.string().trim().min(1, 'نام کسب‌وکار الزامی است').max(100, 'نام کسب‌وکار نباید بیش از ۱۰۰ کاراکتر باشد'),
  website: z.string().trim().max(255),
  taxMode: z.enum(['include', 'exclude']),
  teamLanguage: z.string().trim().min(1).max(32),
  clientLanguage: z.string().trim().min(1).max(32),
  rubika: z.string().trim().max(255),
  instagram: z.string().trim().max(255),
  bale: z.string().trim().max(255),
});
export type BusinessDetailsEditState = { status: 'idle' | 'error'; message?: string };

export async function updateBusinessDetails(_prev: BusinessDetailsEditState, formData: FormData): Promise<BusinessDetailsEditState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { status: 'error', message: 'دسترسی غیرمجاز' };
  const parsed = schema.safeParse(Object.fromEntries(['businessName','website','taxMode','teamLanguage','clientLanguage','rubika','instagram','bale'].map(key => [key, formData.get(key)?.toString() ?? ''])));
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message };
  try {
    await (prisma.business.update as unknown as (args: { where: { ownerId: string }; data: Record<string, unknown> }) => Promise<unknown>)({
      where: { ownerId: session.user.id },
      data: {
        name: parsed.data.businessName,
        website: parsed.data.website || null,
        taxMode: parsed.data.taxMode,
        teamLanguage: parsed.data.teamLanguage,
        clientLanguage: parsed.data.clientLanguage,
        rubika: parsed.data.rubika || null,
        instagram: parsed.data.instagram || null,
        bale: parsed.data.bale || null,
      },
    });
  } catch (error) {
    console.error('Failed to save business details', error);
    return { status: 'error', message: 'ذخیرهٔ اطلاعات انجام نشد. دوباره تلاش کنید.' };
  }
  revalidatePath('/setup/business-setup/business-details');
  redirect('/setup/business-setup/business-details');
}


