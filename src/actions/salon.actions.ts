'use server'

import prisma from '@/lib/prisma'
import { formatBusinessAddress } from '@/lib/business-address'

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
      services: { select: { id: true, name: true, price: true, priceType: true, durationMin: true }, orderBy: { createdAt: 'desc' } },
      teamMembers: { select: { id: true, firstName: true, lastName: true, jobTitle: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!business) return null;

  let point: { lat: number; lng: number } | null = null;
  try {
    const address = JSON.parse(business.businessAddress || '{}');
    if (typeof address.point?.lat === 'number' && typeof address.point?.lng === 'number') point = address.point;
  } catch { /* Older addresses can be plain text. */ }

  return {
    id: business.id, name: business.name,
    address: formatBusinessAddress(business.businessAddress, business.businessLocation) || 'آدرس ثبت نشده است',
    lat: point?.lat ?? null, lng: point?.lng ?? null,
    description: null, imageUrl: null, portfolio: [], reviews: [],
    services: business.services,
    teamMembers: business.teamMembers.map((member) => ({
      id: member.id, name: [member.firstName, member.lastName].filter(Boolean).join(' '),
      role: member.jobTitle || 'عضو تیم', avatarUrl: null,
    })),
  };
}

