import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { BusinessSignUpForm } from '@/components/features/auth/BusinessSignUpForm';
import { DEFAULT_COUNTRY } from '@/components/features/auth/countries';

export const metadata: Metadata = {
  title: 'تکمیل ثبت نام | فرشا',
  description: 'حساب فرشای خود را برای ثبت نام متخصصان کامل کنید. ',
};

function splitDisplayName(name: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

export default async function BusinessCompletePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/business');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      country: true,
    },
  });

  if (!user) {
    redirect('/auth/business');
  }

  if (user.role !== 'CUSTOMER') {
    redirect('/');
  }

  const legacyName = splitDisplayName(user.name);
  const firstName = user.firstName?.trim() || legacyName.firstName;
  const lastName = user.lastName?.trim() || legacyName.lastName;

  return (
    <main dir="ltr" className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
            فرشا برای متخصصان
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">
            تکمیل فرآیند ثبت نام
          </h1>
          <p className="mt-2 text-[15px] leading-7 text-neutral-600">
            به چند مورد از اطلاعات تکمیلی شما نیاز داریم.
          </p>
        </header>

        <BusinessSignUpForm
          initialFirstName={firstName}
          initialLastName={lastName}
          initialPhone={user.phone ?? ''}
          initialCountryCode={user.country ?? DEFAULT_COUNTRY.code}
        />
      </div>
    </main>
  );
}
