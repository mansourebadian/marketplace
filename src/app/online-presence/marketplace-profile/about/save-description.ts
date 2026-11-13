"use server";

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { hasMarketplaceDescriptionColumn } from '@/lib/marketplace-description';

export async function saveDescription(description: string, onlyIfEmpty = false) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return { error: 'برای ذخیره توضیحات دوباره وارد حساب خود شوید.' };
  if (typeof description !== 'string' || description.length > 1200) return { error: 'توضیحات نمی‌تواند بیشتر از ۱۲۰۰ نویسه باشد.' };
  try {
    if (!(await hasMarketplaceDescriptionColumn())) return { error: null, unavailable: true };
    const value = description.trim() || null;
    const result = onlyIfEmpty
      ? await prisma.$executeRaw`UPDATE [dbo].[Business] SET [marketplaceDescription] = ${value} WHERE [ownerId] = ${session.user.id} AND [marketplaceDescription] IS NULL`
      : await prisma.$executeRaw`UPDATE [dbo].[Business] SET [marketplaceDescription] = ${value} WHERE [ownerId] = ${session.user.id}`;
    if (!onlyIfEmpty && !result) return { error: 'کسب‌وکار شما پیدا نشد.' };
    revalidatePath('/online-presence/marketplace-profile');
    return { error: null };
  } catch (error) {
    console.error('Unable to save marketplace description', error);
    return { error: 'ذخیره توضیحات انجام نشد. دوباره تلاش کنید.' };
  }
}
