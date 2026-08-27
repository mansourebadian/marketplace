// src/app/auth/page.tsx
// صفحه انتخاب نوع حساب (ورود / ثبت‌نام) — نسخه راست‌چین و فارسی

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { USER_FLOWS } from '@/components/features/auth/flows';
import { UserFlowCard } from '@/components/features/auth/UserFlowCard';
import { AuthFooter } from '@/components/features/auth/AuthFooter';
import { imageUrl } from '@/lib/image-server';

export const metadata: Metadata = {
  title: 'ورود یا ثبت‌نام | فرِشا',
  description: 'انتخاب نوع حساب کاربری برای ورود یا ثبت‌نام در فرِشا',
};

const SIDE_IMAGE_URL = imageUrl('auth-side.svg');

export default function AuthPage() {
  return (
    <main className="min-h-screen flex">
      {/* ستون فرم: در حالت راست‌چین سمت راست صفحه قرار می‌گیرد */}
      <section className="relative flex flex-col w-full lg:w-1/2 min-h-screen px-6 py-6">
        {/* دکمه بازگشت به صفحه اصلی (فلش رو به راست در RTL) */}
        <Link
          href="/"
          aria-label="بازگشت"
          className="w-fit p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowRight className="w-6 h-6 text-gray-900" />
        </Link>

        {/* محتوای میانی */}
        <div className="flex-1 flex flex-col items-center pt-16">
          <div className="w-full max-w-md flex flex-col gap-10">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              ورود / ثبت‌نام
            </h1>

            <div className="flex flex-col gap-5">
              {USER_FLOWS.map((flow) => (
                <UserFlowCard key={flow.id} flow={flow} />
              ))}
            </div>
          </div>
        </div>

        <AuthFooter />
      </section>

      {/* ستون تصویر: در حالت راست‌چین سمت چپ صفحه قرار می‌گیرد */}
      <aside className="hidden lg:block relative w-1/2 min-h-screen">
        <Image
          src={SIDE_IMAGE_URL}
          alt="مشتری در حال رزرو نوبت با موبایل"
          fill
          priority
          unoptimized
          sizes="50vw"
          className="object-cover"
        />
      </aside>
    </main>
  );
}
