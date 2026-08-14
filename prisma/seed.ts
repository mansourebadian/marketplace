import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // 1. ساخت یک کاربر تستی
  const testUser = await prisma.user.upsert({
    where: { phone: '09123456789' },
    update: {},
    create: {
      phone: '09123456789',
      name: 'کاربر تستی',
      role: 'CUSTOMER',
    },
  })

  // 2. ساخت سالن رویال (با خدمات و تیم)
  const royalSalon = await prisma.salon.create({
    data: {
      name: 'سالن زیبایی رویال',
      address: 'تهران، زعفرانیه',
      lat: 35.807387,
      lng: 51.416219,
      description: 'محیطی آرام و خدماتی شخصی‌سازی شده...',
      imageUrl: '/images/salon-1.jpg',
      priceRange: '$$',
      rating: 4.8,
      reviewsCount: 124,
      services: {
        create: [
          { name: 'اصلاح مو', price: 150000, durationMin: 30 },
          { name: 'رنگ و لایت', price: 800000, durationMin: 120 },
        ],
      },
      teamMembers: {
        create: [
          { name: 'علی حسینی', role: 'متخصص اصلاح' },
          { name: 'سارا رضایی', role: 'متخصص رنگ' },
        ],
      },
      portfolio: {
        create: [
          { imageUrl: '/images/portfolio-1.jpg', order: 1 },
          { imageUrl: '/images/portfolio-2.jpg', order: 2 },
        ]
      }
    },
  })

  // 3. ثبت یک نظر برای سالن
  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'عالی بود، به شدت پیشنهاد میشه!',
      userId: testUser.id,
      salonId: royalSalon.id,
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
