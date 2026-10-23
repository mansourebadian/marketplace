import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 60) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  const current = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessLocation: true } });
  let existing: Record<string, unknown> = {};
  try { existing = JSON.parse(current?.businessLocation || '{}'); } catch {}
  const data = { ...existing, name, internalName: typeof body.internalName === 'string' ? body.internalName.trim() : '', phone: typeof body.phone === 'string' ? body.phone.trim() : '', email: typeof body.email === 'string' ? body.email.trim() : '' };
  await prisma.business.update({ where: { ownerId: session.user.id }, data: { businessLocation: JSON.stringify(data) } });
  return NextResponse.json({ ok: true });
}
