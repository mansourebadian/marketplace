import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AddLocationPage } from '@/components/features/settings/AddLocationPage';
import { prisma } from '@/lib/prisma';
export const metadata: Metadata = { title: 'افزودن موقعیت | فرشا' };
export default async function AddLocationRoute() { const session = await auth(); if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business'); const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessLocation: true } }); let initial: Record<string,string> = {}; try { initial = JSON.parse(business?.businessLocation || '{}'); } catch {} return <AddLocationPage initialValues={{ name: initial.name || '', internalName: initial.internalName || '', phone: initial.phone || '', email: initial.email || '' }} />; }

