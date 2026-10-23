import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
export async function GET(){ const session=await auth(); if(!session?.user?.id) return NextResponse.json({categories:[],selected:[]},{status:401}); const business=await prisma.business.findUnique({where:{ownerId:session.user.id},select:{categories:{select:{slug:true,position:true},orderBy:{position:'asc'}}}}); return NextResponse.json({categories:BUSINESS_CATEGORIES,selected:business?.categories.map(c=>c.slug)??[]}); }

export async function POST(request: Request){ const session=await auth(); if(!session?.user?.id) return NextResponse.json({error:'Unauthorized'},{status:401}); const body=await request.json(); const slugs=Array.isArray(body.slugs)?body.slugs.filter((s:any)=>typeof s==='string').slice(0,4):[]; const business=await prisma.business.findUnique({where:{ownerId:session.user.id},select:{id:true}}); if(!business) return NextResponse.json({error:'Business not found'},{status:404}); if(!slugs.length || new Set(slugs).size!==slugs.length || slugs.some((slug:string)=>!BUSINESS_CATEGORIES.some(c=>c.slug===slug))) return NextResponse.json({error:'Invalid categories'},{status:400}); await prisma.$transaction([prisma.businessCategorySelection.deleteMany({where:{businessId:business.id}}),prisma.businessCategorySelection.createMany({data:slugs.map((slug:string,position:number)=>({businessId:business.id,slug,position}))})]); return NextResponse.json({ok:true}); }

