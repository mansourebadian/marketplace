import { BusinessNameForm } from '@/components/features/onboarding/BusinessNameForm';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function BusinessNamePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'OWNER') {
    redirect('/auth/business');
  }

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, website: true },
  });

  return (
    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
      {/* Continue button — top right (handled inside form via portal or absolute) */}
      <BusinessNameForm initialName={business?.name} initialWebsite={business?.website ?? ''} />
    </div>
  );
}
