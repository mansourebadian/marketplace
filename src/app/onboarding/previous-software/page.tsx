import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { PreviousSoftwareForm } from '@/components/features/onboarding/PreviousSoftwareForm';
export default async function PreviousSoftwarePage() { const session = await auth(); if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business'); const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { previousSoftware: true } }); if (!business) redirect('/onboarding/business-name'); return <PreviousSoftwareForm initialSoftware={business.previousSoftware ?? ''} />; }
