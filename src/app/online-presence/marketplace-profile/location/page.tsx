import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { LocationForm, type AddressDetails } from './location-form';

export const metadata: Metadata = { title: 'موقعیت کسب‌وکار | آرینو' };

export default async function MarketplaceLocationPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true, businessLocation: true, locations: { orderBy: { createdAt: 'asc' }, take: 1, select: { address: true } } } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  let details: Partial<AddressDetails> = {};
  try { const parsed: unknown = JSON.parse(business.businessAddress); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) details = parsed as Partial<AddressDetails>; } catch { /* Older records may contain plain text. */ }
  let city = business.businessLocation || '';
  if (city.startsWith('{')) { try { const parsed = JSON.parse(city); city = typeof parsed.city === 'string' ? parsed.city : ''; } catch { city = ''; } }
  return <LocationForm city={city} initialDetails={details} locationAddress={business.locations[0]?.address || ''} />;
}
