import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AddLocationPage } from '@/components/features/settings/AddLocationPage';
import { prisma } from '@/lib/prisma';
export const metadata: Metadata = { title: 'افزودن موقعیت | فرشا' };
export default async function AddLocationRoute() { const session = await auth(); if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business'); return <AddLocationPage initialValues={{ name: '', internalName: '', phone: '', email: '' }} />; }

