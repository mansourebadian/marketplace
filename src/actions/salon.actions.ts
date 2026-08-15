'use server'

import prisma from '@/lib/prisma'

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
