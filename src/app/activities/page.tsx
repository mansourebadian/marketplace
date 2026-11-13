import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Header } from '@/components/shared/Header';
import { prisma } from '@/lib/prisma';
import {
  ActivitiesPageClient,
  type ActivitiesUser,
} from '@/components/features/activities/ActivitiesPageClient';

export const metadata: Metadata = {
  title: 'فعالیت‌ها | آرینو',
  description: 'مشاهده نوبت‌ها، کارت‌های هدیه و خریدهای حساب کاربری آرینو',
};

export default async function ActivitiesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/customer?callbackUrl=%2Factivities');
  }

  const user: ActivitiesUser = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };

  const reservations = await prisma.businessReservation.findMany({
    where: { customerId: session.user.id },
    select: { id: true, status: true, total: true, business: { select: { name: true } }, items: { orderBy: { position: 'asc' }, select: { serviceName: true, startsAt: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <Header hasSearch />
      <ActivitiesPageClient user={user} reservations={reservations.map(reservation => ({ ...reservation, items: reservation.items.map(item => ({ ...item, startsAt: item.startsAt.toISOString() })) }))} />
    </div>
  );
}
