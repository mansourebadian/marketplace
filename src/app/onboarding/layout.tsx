import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { OnboardingProgress } from '@/components/features/onboarding/OnboardingProgress';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect('/auth/business');
  if (session.user.role !== 'OWNER') redirect('/');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <OnboardingProgress />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
