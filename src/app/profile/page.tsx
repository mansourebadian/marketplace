import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Header } from '@/components/shared/Header';
import {
  ProfilePageClient,
  type AddressLabel,
} from '@/components/features/profile/ProfilePageClient';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'پروفایل من | فرشا',
  description: 'مشاهده و ویرایش مشخصات و آدرس‌های حساب مشتری فرشا',
};

function splitDisplayName(name: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/customer?callbackUrl=%2Fprofile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      image: true,
      dateOfBirth: true,
      gender: true,
      addresses: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          label: true,
          addressLine: true,
          city: true,
          province: true,
          postalCode: true,
        },
      },
    },
  });

  if (!user || user.role !== 'CUSTOMER') {
    redirect('/');
  }

  const legacyName = splitDisplayName(user.name);
  const firstName = user.firstName?.trim() || legacyName.firstName;
  const lastName = user.lastName?.trim() || legacyName.lastName;
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') || user.email;

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <Header hasSearch />
      <ProfilePageClient
        profile={{
          firstName,
          lastName,
          displayName,
          email: user.email,
          phone: user.phone ?? '',
          image: user.image ?? '',
          dateOfBirth: user.dateOfBirth?.toISOString().slice(0, 10) ?? '',
          gender: user.gender ?? '',
        }}
        addresses={user.addresses
          .filter(
            (address): address is typeof address & { label: AddressLabel } =>
              address.label === 'HOME' || address.label === 'WORK'
          )
          .map((address) => ({
            ...address,
            city: address.city ?? '',
            province: address.province ?? '',
            postalCode: address.postalCode ?? '',
          }))}
      />
    </div>
  );
}
