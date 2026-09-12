// src/app/auth/customer/page.tsx
// صفحه ورود / ثبت‌نام مشتریان با تشخیص کد کشور از IP

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { auth } from '@/auth';
import { CustomerAuthForm } from '@/components/features/auth/CustomerAuthForm';
import { AuthFooter } from '@/components/features/auth/AuthFooter';
import { imageUrl } from '@/lib/image-server';

export const metadata: Metadata = {
  title: 'فرشا برای مشتریان | فرشا',
  description: 'ورود یا ثبت‌نام مشتریان برای رزرو و مدیریت نوبت‌ها در فرشا',
};

const SIDE_IMAGE_URL = imageUrl('auth-side.svg');

interface CustomerAuthPageProps {
  searchParams: Promise<{
    error?: string | string[];
    callbackUrl?: string | string[];
  }>;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    'ورود با گوگل فقط برای حساب‌هایی که ایمیل تأییدشده دارند امکان‌پذیر است.',
  OAuthAccountNotLinked:
    'این ایمیل قبلاً با روش دیگری ثبت شده است. ابتدا با همان روش وارد شوید.',
  Configuration:
    'تنظیمات ورود با گوگل هنوز کامل نشده است. با پشتیبانی تماس بگیرید.',
};

export default async function CustomerAuthPage({
  searchParams,
}: CustomerAuthPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  const callbackUrlParam = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackUrl =
    callbackUrlParam?.startsWith('/') && !callbackUrlParam.startsWith('//')
      ? callbackUrlParam
      : '/profile';

  if (session?.user) {
    redirect(callbackUrl);
  }

  const errorCode = Array.isArray(params.error)
    ? params.error[0]
    : params.error;
  const authError = errorCode
    ? AUTH_ERROR_MESSAGES[errorCode] ||
      'ورود با گوگل انجام نشد. لطفاً دوباره تلاش کنید.'
    : null;

  return (
    <main className="min-h-screen flex">
      <section className="relative flex flex-col w-full lg:w-1/2 min-h-screen px-6 py-6">
        <Link
          href="/auth"
          aria-label="بازگشت"
          className="w-fit p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowRight className="w-6 h-6 text-gray-900" />
        </Link>

        <div className="flex-1 flex flex-col items-center pt-10">
          <div className="w-full max-w-md flex flex-col gap-7">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-3xl font-bold text-gray-900">
                فرشا برای مشتریان
              </h1>
              <p className="mt-3 text-[15px] leading-7 text-gray-500">
                حساب بسازید یا وارد شوید تا نوبت‌های خود را رزرو و مدیریت کنید
              </p>
            </div>

            <CustomerAuthForm
              authError={authError}
              callbackUrl={callbackUrl}
            />
          </div>
        </div>

        <AuthFooter />
      </section>

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
