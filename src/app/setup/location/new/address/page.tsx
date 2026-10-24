import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BusinessAddressForm } from '@/components/features/onboarding/BusinessAddressForm';
export const metadata={title:'\u0645\u0648\u0642\u0639\u06cc\u062a \u06a9\u0633\u0628\u200c\u0648\u06a9\u0627\u0631 | \u0641\u0631\u0634\u0627'};
export default async function LocationAddressPage(){const session=await auth();if(!session?.user?.id||session.user.role!=='OWNER')redirect('/auth/business');return <BusinessAddressForm initialLocation="" initialAddress="" backHref="/setup/location/new/business-type" targetLocation/>;}
