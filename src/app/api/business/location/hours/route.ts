import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export async function POST(request: Request) {
 const session=await auth(); if(!session?.user?.id||session.user.role!=='OWNER') return NextResponse.json({error:'Unauthorized'},{status:401});
 const {hours}=await request.json(); if(!hours||typeof hours!=='object') return NextResponse.json({error:'Invalid hours'},{status:400});
 for(const value of Object.values(hours) as any[]){if(value?.enabled===false) continue;if(typeof value?.open!=='string'||typeof value?.close!=='string'||value.open>=value.close)return NextResponse.json({error:'Opening time must be before closing time'},{status:400});}
 const business=await prisma.business.findUnique({where:{ownerId:session.user.id},select:{id:true,name:true,businessLocation:true}});if(!business)return NextResponse.json({error:'Not found'},{status:404});
 let old:any={};try{old=JSON.parse(business.businessLocation||'{}')}catch{}
 const existing=await prisma.businessLocation.findFirst({where:{businessId:business.id},orderBy:{createdAt:'asc'}}); const location=existing ? await prisma.businessLocation.update({where:{id:existing.id},data:{name:old.name||business.name,internalName:old.internalName||null,phone:old.phone||null,email:old.email||null,address:old.address||null,noFixedAddress:Boolean(old.noFixedAddress)}}) : await prisma.businessLocation.create({data:{businessId:business.id,name:old.name||business.name,internalName:old.internalName||null,phone:old.phone||null,email:old.email||null,address:old.address||null,noFixedAddress:Boolean(old.noFixedAddress)}});
 await prisma.locationOpeningHour.deleteMany({where:{locationId:location.id}}); await prisma.locationOpeningHour.createMany({data:Object.entries(hours).map(([day,value]:any, index)=>({locationId:location.id,day:index,enabled:value.enabled!==false,opensAt:value.open,closesAt:value.close}))}); return NextResponse.json({ok:true,locationId:location.id});
}

