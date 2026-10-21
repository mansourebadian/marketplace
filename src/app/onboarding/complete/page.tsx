import Link from 'next/link';
import { Check } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function OnboardingCompletePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { businessAddress: true },
  });

  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return (
    <section
      dir="rtl"
      aria-labelledby="onboarding-complete-title"
      className="flex min-h-svh flex-1 flex-col items-center justify-center bg-white px-6 py-16 text-center text-neutral-950"
    >
      <div className="flex w-full max-w-lg -translate-y-[10vh] flex-col items-center">
        <div
          aria-hidden="true"
          className="mb-5 flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_65%_35%,#dc00ff_0%,#be00ed_45%,#a73be1_72%,#ddb4fa_100%)] shadow-[inset_0_0_12px_3px_rgba(255,255,255,0.55)]"
        >
          <Check className="h-10 w-10 text-white" strokeWidth={1.8} />
        </div>
        <h1 id="onboarding-complete-title" className="text-2xl font-bold leading-relaxed sm:text-[28px]">
          کسب‌وکار شما راه‌اندازی شد!
        </h1>
        <p className="mt-1 text-sm leading-7 text-neutral-500">
          همه‌چیز برای شروع مدیریت کسب‌وکار شما آماده است.
        </p>
        <Link
          href="/calendar"
          replace
          className="mt-6 inline-flex min-h-12 min-w-20 items-center justify-center rounded-full bg-neutral-950 px-6 py-3 font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
        >
          پایان
        </Link>
      </div>
    </section>
  );
}
