import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Header } from '@/components/shared/Header';
import {
  ActivitiesPageClient,
  type ActivitiesUser,
} from '@/components/features/activities/ActivitiesPageClient';

export const metadata: Metadata = {
  title: 'فعالیت‌ها | فرشا',
  description: 'مشاهده نوبت‌ها، کارت‌های هدیه و خریدهای حساب کاربری فرشا',
};

export default async function ActivitiesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/customer?callbackUrl=%2Factivities');
  }

  if (session.user.role !== 'CUSTOMER') {
    redirect('/');
  }

  const user: ActivitiesUser = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <Header hasSearch />
      <ActivitiesPageClient user={user} />
    </div>
  );
}
