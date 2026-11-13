'use server'

import prisma from '@/lib/prisma'
import { formatBusinessAddress } from '@/lib/business-address'
import { imageUrl } from '@/lib/image-server'
import { getMarketplaceDescription } from '@/lib/marketplace-description'
import { featureGroups } from '@/app/online-presence/marketplace-profile/features/options'

// گرفتن جزئیات کامل یک سالن بر اساس ID
export async function getSalonById(id: string) {
  try {
    const salon = await prisma.salon.findUnique({
      where: { id },
      include: {
        services: true,
        teamMembers: true,
        portfolio: {
          orderBy: { order: 'asc' } // مرتب‌سازی عکس‌های نمونه‌کار
        },
        reviews: {
          include: {
            user: true // برای نمایش نام کاربری که نظر داده
          },
          orderBy: { date: 'desc' } // نظرات جدیدتر اول نمایش داده شوند
        }
      },
    })
    
    return salon
  } catch (error) {
    console.error(`Error fetching salon with ID ${id}:`, error)
    return null
  }
}

// گرفتن لیست همه سالن‌ها (برای صفحه اصلی یا جستجو)
export async function getAllSalons() {
  try {
    return await prisma.salon.findMany({
      include: {
        services: true
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching salons:', error)
    return []
  }
}

// دریافت اطلاعات عمومی کسب‌وکار برای صفحه سالن
export async function getBusinessAsSalon(id: string) {
  const business = await prisma.business.findFirst({
    where: { id, businessAddress: { not: null } },
    select: {
      id: true, name: true, businessAddress: true, businessLocation: true,
      locations: { orderBy: { createdAt: 'asc' }, take: 1, select: { name: true, openingHours: { select: { day: true, enabled: true, opensAt: true, closesAt: true }, orderBy: { day: 'asc' } } } },
      services: { select: { id: true, name: true, price: true, priceType: true, durationMin: true }, orderBy: { createdAt: 'desc' } },
      teamMembers: { select: { id: true, firstName: true, lastName: true, jobTitle: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!business) return null;

  let point: { lat: number; lng: number } | null = null;
  let images: string[] = [];
  let featureMask = 0;
  let extraHours: Record<string, { opensAt?: unknown; closesAt?: unknown }> = {};
  try {
    const address = JSON.parse(business.businessAddress || '{}');
    if (typeof address.point?.lat === 'number' && typeof address.point?.lng === 'number') point = address.point;
    if (Array.isArray(address.venueImages)) images = address.venueImages.filter((name: unknown): name is string => typeof name === 'string' && /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i.test(name)).slice(0, 10);
    if (typeof address.venueFeatures === 'number' && Number.isSafeInteger(address.venueFeatures) && address.venueFeatures >= 0) featureMask = address.venueFeatures;
    if (address.secondOpeningHours && typeof address.secondOpeningHours === 'object' && !Array.isArray(address.secondOpeningHours)) extraHours = address.secondOpeningHours;
  } catch { /* Older addresses can be plain text. */ }

  const description = await getMarketplaceDescription(business.id);
  return {
    id: business.id, name: business.locations[0]?.name || business.name,
    address: formatBusinessAddress(business.businessAddress, business.businessLocation) || 'آدرس ثبت نشده است',
    lat: point?.lat ?? null, lng: point?.lng ?? null,
    description, imageUrl: images[0] ? imageUrl(images[0]) : null, portfolio: images.map((name) => ({ imageUrl: imageUrl(name) })), reviews: [],
    openingHours: (business.locations[0]?.openingHours ?? []).map(hour => {
      const second = extraHours[hour.day];
      const isTime = (value: unknown): value is string => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
      return { ...hour, secondOpensAt: isTime(second?.opensAt) && isTime(second?.closesAt) ? second.opensAt : null, secondClosesAt: isTime(second?.opensAt) && isTime(second?.closesAt) ? second.closesAt : null };
    }),
    features: featureGroups.flatMap<{ id: string; label: string }>(group => group.options.map(option => ({ id: option.id, label: option.label }))).filter((_, index) => Boolean(featureMask & (1 << index))),
    services: business.services,
    teamMembers: business.teamMembers.map((member) => ({
      id: member.id, name: [member.firstName, member.lastName].filter(Boolean).join(' '),
      role: member.jobTitle || 'عضو تیم', avatarUrl: null,
    })),
  };
}

