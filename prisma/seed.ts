import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

// دسته‌بندی خدمات - مشابه لیست Treatments در Fresha
const categories = [
  { slug: 'hair-styling',       name: 'مو و آرایش مو',        icon: 'Scissors',       order: 1 },
  { slug: 'nails',              name: 'ناخن',                  icon: 'Hand',           order: 2 },
  { slug: 'hair-removal',       name: 'اپیلاسیون و موزدایی',   icon: 'Zap',            order: 3 },
  { slug: 'brows-lashes',       name: 'ابرو و مژه',            icon: 'Eye',            order: 4 },
  { slug: 'facials-skincare',   name: 'پاکسازی و مراقبت پوست', icon: 'Smile',          order: 5 },
  { slug: 'massage',            name: 'ماساژ',                 icon: 'Flower2',        order: 6 },
  { slug: 'barbering',          name: 'آرایشگری مردانه',       icon: 'SprayCan',       order: 7 },
  { slug: 'makeup',             name: 'میکاپ',                 icon: 'Palette',        order: 8 },
  { slug: 'injectables',        name: 'تزریقات و فیلر',        icon: 'Syringe',        order: 9 },
  { slug: 'body',               name: 'بدن',                   icon: 'PersonStanding', order: 10 },
  { slug: 'tattoo-piercing',    name: 'تاتو و پیرسینگ',        icon: 'Brush',          order: 11 },
  { slug: 'medical-dental',     name: 'پزشکی و دندانپزشکی',    icon: 'Stethoscope',    order: 12 },
  { slug: 'counseling',         name: 'مشاوره و سلامت جامع',   icon: 'HeartPulse',     order: 13 },
  { slug: 'fitness',            name: 'تناسب اندام',           icon: 'Dumbbell',       order: 14 },
]

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

  // 2. ساخت/به‌روزرسانی دسته‌بندی‌های خدمات (upsert بر اساس slug - بدون حذف داده)
  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, order: cat.order },
      create: cat,
    })
    categoryMap[cat.slug] = created.id
  }
  console.log(`${categories.length} service categories upserted.`)

  // 3. ساخت سالن رویال (فقط اگر قبلا وجود نداشته باشد)
  let royalSalon = await prisma.salon.findFirst({ where: { name: 'سالن زیبایی رویال' } })
  if (!royalSalon) {
    royalSalon = await prisma.salon.create({
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
            { name: 'اصلاح مو', price: 150000, durationMin: 30, categoryId: categoryMap['hair-styling'] },
            { name: 'رنگ و لایت', price: 800000, durationMin: 120, categoryId: categoryMap['hair-styling'] },
            { name: 'کراتینه مو', price: 1200000, durationMin: 150, categoryId: categoryMap['hair-styling'] },
            { name: 'مانیکور', price: 250000, durationMin: 45, categoryId: categoryMap['nails'] },
            { name: 'پدیکور', price: 300000, durationMin: 60, categoryId: categoryMap['nails'] },
            { name: 'کاشت ناخن', price: 550000, durationMin: 90, categoryId: categoryMap['nails'] },
            { name: 'اپیلاسیون کامل بدن', price: 600000, durationMin: 90, categoryId: categoryMap['hair-removal'] },
            { name: 'لیفت و لمینت مژه', price: 450000, durationMin: 60, categoryId: categoryMap['brows-lashes'] },
            { name: 'میکروبلیدینگ ابرو', price: 900000, durationMin: 90, categoryId: categoryMap['brows-lashes'] },
            { name: 'پاکسازی پوست', price: 400000, durationMin: 60, categoryId: categoryMap['facials-skincare'] },
            { name: 'میکاپ عروس', price: 3500000, durationMin: 180, categoryId: categoryMap['makeup'] },
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

    // ثبت یک نظر برای سالن رویال
    await prisma.review.create({
      data: {
        rating: 5,
        comment: 'عالی بود، به شدت پیشنهاد میشه!',
        userId: testUser.id,
        salonId: royalSalon.id,
      }
    })
  } else {
    // اتصال خدمات موجود بدون دسته‌بندی به دسته مناسب
    await prisma.service.updateMany({
      where: { salonId: royalSalon.id, categoryId: null, name: { in: ['اصلاح مو', 'رنگ و لایت'] } },
      data: { categoryId: categoryMap['hair-styling'] },
    })
  }

  // 4. ساخت سالن دوم - باربرشاپ (فقط اگر وجود نداشته باشد)
  const kingExists = await prisma.salon.findFirst({ where: { name: 'باربرشاپ کینگ' } })
  if (!kingExists) {
    await prisma.salon.create({
      data: {
        name: 'باربرشاپ کینگ',
        address: 'تهران، ونک',
        lat: 35.757580,
        lng: 51.410622,
        description: 'آرایشگاه مردانه با جدیدترین متدهای روز دنیا',
        imageUrl: '/images/salon-2.jpg',
        priceRange: '$',
        rating: 4.6,
        reviewsCount: 87,
        services: {
          create: [
            { name: 'اصلاح سر و صورت', price: 200000, durationMin: 40, categoryId: categoryMap['barbering'] },
            { name: 'اصلاح ریش و خط ریش', price: 120000, durationMin: 25, categoryId: categoryMap['barbering'] },
            { name: 'ماساژ سر و گردن', price: 180000, durationMin: 30, categoryId: categoryMap['massage'] },
            { name: 'ماساژ ریلکسی بدن', price: 700000, durationMin: 75, categoryId: categoryMap['massage'] },
            { name: 'تاتو مینیمال', price: 1500000, durationMin: 120, categoryId: categoryMap['tattoo-piercing'] },
          ],
        },
        teamMembers: {
          create: [
            { name: 'رضا محمدی', role: 'باربر ارشد' },
            { name: 'امیر کریمی', role: 'ماساژور' },
          ],
        },
      },
    })
  }

  // 5. ساخت سالن سوم - کلینیک زیبایی (فقط اگر وجود نداشته باشد)
  const avinaExists = await prisma.salon.findFirst({ where: { name: 'کلینیک زیبایی آوینا' } })
  if (!avinaExists) {
    await prisma.salon.create({
      data: {
        name: 'کلینیک زیبایی آوینا',
        address: 'تهران، سعادت‌آباد',
        lat: 35.784560,
        lng: 51.375848,
        description: 'کلینیک تخصصی پوست، مو و زیبایی زیر نظر پزشک متخصص',
        imageUrl: '/images/salon-3.jpg',
        priceRange: '$$$',
        rating: 4.9,
        reviewsCount: 215,
        services: {
          create: [
            { name: 'تزریق بوتاکس', price: 2500000, durationMin: 45, categoryId: categoryMap['injectables'] },
            { name: 'تزریق فیلر لب', price: 4000000, durationMin: 60, categoryId: categoryMap['injectables'] },
            { name: 'لیزر موهای زائد', price: 800000, durationMin: 60, categoryId: categoryMap['hair-removal'] },
            { name: 'هیدرافیشیال', price: 950000, durationMin: 75, categoryId: categoryMap['facials-skincare'] },
            { name: 'مزوتراپی مو', price: 1800000, durationMin: 60, categoryId: categoryMap['medical-dental'] },
            { name: 'مشاوره تغذیه و رژیم', price: 500000, durationMin: 45, categoryId: categoryMap['counseling'] },
            { name: 'ماساژ درمانی بدن', price: 850000, durationMin: 90, categoryId: categoryMap['body'] },
            { name: 'برنامه تمرینی شخصی', price: 600000, durationMin: 60, categoryId: categoryMap['fitness'] },
          ],
        },
        teamMembers: {
          create: [
            { name: 'دکتر مریم احمدی', role: 'پزشک زیبایی' },
            { name: 'نگار موسوی', role: 'کارشناس لیزر' },
          ],
        },
      },
    })
  }

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
