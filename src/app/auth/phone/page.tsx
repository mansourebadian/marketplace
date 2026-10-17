import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { OTP_COOKIE, OTP_COOLDOWN, getPhoneChallenge } from '@/lib/phone-otp';
import { PhoneOtpForm } from '@/components/features/auth/PhoneOtpForm';

export const metadata: Metadata = { title: 'تأیید شماره موبایل | فرشا', robots: { index: false, follow: false } };

export default async function PhoneVerificationPage() {
  const id = (await cookies()).get(OTP_COOKIE)?.value;
  if (!id) redirect('/auth');
  const challenge = await getPhoneChallenge(prisma, id);
  if (!challenge) redirect('/auth');
  const business = challenge.flow === 'business';
  const backHref = business ? '/auth/business?method=phone' : `/auth/customer?callbackUrl=${encodeURIComponent(challenge.callbackUrl)}`;

  return <main dir="ltr" className="relative flex min-h-[100dvh] w-full overflow-x-hidden bg-white lg:h-[100dvh] lg:overflow-hidden">
    <section dir="rtl" className="relative z-20 flex min-h-[100dvh] w-full flex-col bg-white px-5 py-5 sm:px-8 lg:w-1/2 lg:overflow-y-auto">
      <Link href={backHref} aria-label="بازگشت و ویرایش شماره موبایل" className="absolute left-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100 sm:left-8 sm:top-5"><ArrowLeft className="h-6 w-6" /></Link>
      <div className="mx-auto w-full max-w-[396px] pb-10 pt-20 lg:pt-[8vh]">
        <PhoneOtpForm key={challenge.id} phone={challenge.phone} resendAt={challenge.createdAt.getTime() + OTP_COOLDOWN} backHref={backHref} />
      </div>
    </section>
    <aside className="relative hidden min-h-[100dvh] w-1/2 overflow-hidden lg:block">
      <Image src="/images/professionals-auth-hero.png" alt="متخصصان زیبایی در سالن" fill priority sizes="50vw" className="object-cover object-center" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
      <div aria-hidden="true" className="absolute -left-[7%] top-[-5%] z-10 h-[110%] w-[14%] rounded-[50%] bg-white" />
      <div dir="rtl" className="absolute inset-x-0 bottom-[7%] z-20 text-center text-white"><p className="text-5xl font-bold">فرشا</p><p className="mt-2 text-xl font-semibold">{business ? 'برای متخصصان' : 'برای مشتریان'}</p></div>
    </aside>
  </main>;
}
