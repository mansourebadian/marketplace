import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BusinessAuthForm } from '@/components/features/auth/BusinessAuthForm';

export const metadata: Metadata = {
  title: 'فرشا برای متخصصان | فرشا',
  description: 'ورود یا ساخت حساب کسب‌وکار برای مدیریت و رشد مجموعه در فرشا',
};

export default function BusinessAuthPage() {
  return (
    <main
      dir="ltr"
      className="relative flex min-h-[100dvh] w-full overflow-x-hidden bg-white lg:h-[100dvh] lg:overflow-hidden"
    >
      <section
        dir="rtl"
        className="relative z-20 flex min-h-[100dvh] w-full flex-col bg-white px-5 py-5 sm:px-8 lg:w-[52%] lg:overflow-y-auto lg:px-10 lg:py-7"
      >
        <Link
          href="/"
          aria-label="بازگشت به صفحه اصلی"
          className="absolute left-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full text-neutral-900 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 sm:left-8 sm:top-7"
        >
          <ArrowLeft aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
        </Link>

        <div className="flex flex-1 justify-center pb-10 pt-20 sm:pt-24 lg:pb-8 lg:pt-[8vh]">
          <div className="w-full max-w-[420px]">
            <header className="mb-7 text-center">
              <h1 className="text-[28px] font-bold tracking-tight text-neutral-950 sm:text-[30px]">
                فرشا برای متخصصان
              </h1>
              <p className="mt-2 text-[15px] leading-7 text-neutral-600">
                برای مدیریت کسب‌وکارتان حساب بسازید یا وارد شوید
              </p>
            </header>

            <BusinessAuthForm />
          </div>
        </div>

        <p className="mx-auto max-w-md pb-2 text-center text-xs leading-5 text-neutral-500">
          با ادامه، شرایط استفاده و سیاست حفظ حریم خصوصی فرشا را می‌پذیرید.
        </p>
      </section>

      <aside className="relative hidden min-h-[100dvh] overflow-hidden lg:block lg:w-[48%]">
        <Image
          src="/images/professionals-auth-hero.png"
          alt="سه متخصص زیبایی در یک سالن مدرن"
          fill
          priority
          sizes="48vw"
          className="object-cover object-center"
        />

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/90 via-black/35 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute -left-[7%] top-[-5%] z-10 h-[110%] w-[14%] rounded-[50%] bg-white"
        />

        <div
          dir="rtl"
          className="absolute inset-x-0 bottom-[8%] z-20 text-center text-white"
        >
          <p className="text-5xl font-bold tracking-tight drop-shadow-sm">فرشا</p>
          <p className="mt-1 text-xl font-semibold drop-shadow-sm">برای متخصصان</p>
        </div>
      </aside>
    </main>
  );
}
