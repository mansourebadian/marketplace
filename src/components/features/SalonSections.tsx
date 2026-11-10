import Link from 'next/link';
import { ImageOff, Star } from 'lucide-react';
import prisma from '@/lib/prisma';
import { formatBusinessAddress } from '@/lib/business-address';

type Card = {
  id: string;
  name: string;
  address: string | null;
  imageUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  createdAt: Date;
  href: string;
};

async function getSalons(): Promise<Card[] | null> {
  try {
    const [salons, businesses] = await Promise.all([
      prisma.salon.findMany({ orderBy: { createdAt: 'desc' }, take: 40 }),
      prisma.business.findMany({
        where: { businessAddress: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, name: true, businessAddress: true, businessLocation: true, createdAt: true },
      }),
    ]);
    return [
      ...salons.map((salon) => ({ ...salon, href: `/salon/${salon.id}` })),
      ...businesses.map((business) => ({
        id: business.id, name: business.name,
        address: formatBusinessAddress(business.businessAddress, business.businessLocation),
        imageUrl: null, rating: null, reviewsCount: null,
        createdAt: business.createdAt, href: `/salon/${business.id}?source=business`,
      })),
    ];
  } catch (error) {
    console.error('Error fetching homepage salons:', error);
    return null;
  }
}

function SalonRow({ title, salons, isNew = false }: { title: string; salons: Card[]; isNew?: boolean }) {
  return (
    <section aria-label={title} className="mb-14">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">{title}</h2>
      <div className="grid grid-flow-col auto-cols-[80%] gap-5 overflow-x-auto pb-4 sm:auto-cols-[45%] lg:auto-cols-[calc((100%-3.75rem)/4)] snap-x snap-mandatory">
        {salons.map((salon) => (
          <Link key={salon.href} href={salon.href} className="group min-w-0 snap-start">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-gray-100">
              {salon.imageUrl ? (
                // Salon images can come from the business's own image host.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={salon.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400"><ImageOff className="h-8 w-8" /><span className="text-sm">تصویری ثبت نشده است</span></div>
              )}
              {isNew && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900">جدید</span>}
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <h3 className="truncate font-bold text-gray-900 group-hover:underline">{salon.name}</h3>
              {!!salon.rating && <span className="flex shrink-0 items-center gap-1 text-sm font-bold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{salon.rating.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}</span>}
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">{salon.address || 'آدرس ثبت نشده است'}</p>
            {!!salon.reviewsCount && <p className="mt-1 text-sm text-gray-500">{salon.reviewsCount.toLocaleString('fa-IR')} نظر</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function SalonSections() {
  const salons = await getSalons();
  if (!salons || salons.length === 0) {
    return <div className="mx-auto max-w-[1400px] px-4 pb-20 text-center text-gray-500">{salons ? 'هنوز سالنی برای نمایش ثبت نشده است.' : 'در حال حاضر دریافت سالن‌ها امکان‌پذیر نیست.'}</div>;
  }
  const recent = [...salons].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const recommended = [...salons].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0) || b.createdAt.getTime() - a.createdAt.getTime());
  return <div className="mx-auto max-w-[1400px] px-4 pb-12 md:px-8"><SalonRow title="سالن‌های پیشنهادی" salons={recommended} /><SalonRow title="تازه به فریشا پیوسته‌اند" salons={recent} isNew /></div>;
}

