import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { LocationAddress } from '@/components/features/settings/LocationAddress';
export const metadata={title:'موقعیت کسب‌وکار | فرشا'};
export default async function LocationAddressPage(){const session=await auth();if(!session?.user?.id||session.user.role!=='OWNER')redirect('/auth/business');const business=await prisma.business.findUnique({where:{ownerId:session.user.id},select:{businessAddress:true}});let address='';let mobile=false;try{const data=JSON.parse(business?.businessAddress||'{}');mobile=data.noFixedAddress===true;address=typeof data.address==='string'?data.address:typeof data.addressLine==='string'?data.addressLine:'';}catch{}return <LocationAddress initialAddress={address} initialMobile={mobile}/>;}

