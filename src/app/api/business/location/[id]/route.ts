import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
 const session = await auth(); if (!session?.user?.id || session.user.role !== 'OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 const { id } = await params; const location = await prisma.businessLocation.findFirst({ where: { id, business: { ownerId: session.user.id } }, select: { id: true } });
 if (!location) return NextResponse.json({ error: 'Not found' }, { status: 404 }); await prisma.businessLocation.delete({ where: { id: location.id } }); return NextResponse.json({ ok: true });
}
