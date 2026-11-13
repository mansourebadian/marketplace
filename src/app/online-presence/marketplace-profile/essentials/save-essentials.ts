'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const fields = z.object({
  locationId: z.string().max(36),
  name: z.string().trim().min(1).max(60),
  phone: z.string().trim().max(32),
  email: z.union([z.literal(''), z.string().trim().email().max(320)]),
});

export async function saveEssentials(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const values = fields.parse(Object.fromEntries(formData.entries()));
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!business) redirect('/onboarding/business-name');
  const data = { name: values.name, phone: values.phone || null, email: values.email || null };
  if (values.locationId) {
    const result = await prisma.businessLocation.updateMany({ where: { id: values.locationId, businessId: business.id }, data });
    if (result.count !== 1) throw new Error('Location not found');
  } else {
    const existing = await prisma.businessLocation.findFirst({ where: { businessId: business.id }, select: { id: true } });
    if (existing) throw new Error('Location already exists');
    await prisma.businessLocation.create({ data: { businessId: business.id, ...data } });
  }
  redirect(formData.get('destination') === 'location' ? '/online-presence/marketplace-profile/location' : '/online-presence/marketplace-profile');
}
