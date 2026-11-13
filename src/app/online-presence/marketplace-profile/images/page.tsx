import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ImagesForm from './images-form';

export const metadata: Metadata = { title: 'تصاویر کسب‌وکار | آرینو' };

export default async function VenueImagesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  let images: string[] = [];
  try { const data = JSON.parse(business.businessAddress); if (Array.isArray(data.venueImages)) images = data.venueImages.filter((item: unknown): item is string => typeof item === 'string' && /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i.test(item)).slice(0, 10); } catch { /* Legacy address values can be plain text. */ }
  return <ImagesForm initialImages={images} />;
}
