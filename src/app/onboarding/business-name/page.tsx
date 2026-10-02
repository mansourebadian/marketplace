import { BusinessNameForm } from '@/components/features/onboarding/BusinessNameForm';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function BusinessNamePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'OWNER') {
    redirect('/auth/business');
  }

  return (
    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
      {/* Continue button — top right (handled inside form via portal or absolute) */}
      <BusinessNameForm />
    </div>
  );
}
