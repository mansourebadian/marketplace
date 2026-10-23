import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { WorkingHours } from '@/components/features/settings/WorkingHours';
export default async function WorkingHoursPage(){const session=await auth();if(!session?.user?.id||session.user.role!=='OWNER')redirect('/auth/business');const business=await prisma.business.findUnique({where:{ownerId:session.user.id},select:{id:true}});let hours:Record<string,any>={};if(business){const location=await prisma.businessLocation.findFirst({where:{businessId:business.id},orderBy:{createdAt:'desc'},include:{openingHours:true}});if(location){for(const item of location.openingHours){const day=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'][item.day];if(day)hours[day]={open:item.opensAt,close:item.closesAt,enabled:item.enabled};}}}return <WorkingHours initialHours={hours}/>;}
