import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { readClientPhoto } from '@/lib/client-photo';
import { createHash } from 'node:crypto';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return new Response(null, { status: 401 });
  const { id } = await params;
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!business) return new Response(null, { status: 404 });
  const client = await prisma.businessClient.findFirst({ where: { id, businessId: business.id }, select: { photo: true, photoType: true } });
  if (client?.photo && client.photoType) return new Response(new Uint8Array(client.photo), { headers: { 'Content-Type': client.photoType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  const reservation = await prisma.businessReservation.findFirst({ where: { businessId: business.id, customerId: id }, select: { id: true } });
  if (!reservation) return new Response(null, { status: 404 });
  const photo = await prisma.businessClientPhoto.findFirst({ where: { businessId: business.id, customerId: id }, select: { photo: true, photoType: true } });
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo.photo), { headers: { 'Content-Type': photo.photoType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: 'تصویر معتبر نیست.' }, { status: 400 }); }
  const photo = await readClientPhoto(form.get('photo'));
  if (!photo) return Response.json({ error: 'تصویر باید PNG، JPEG یا WebP معتبر و حداکثر ۵ مگابایت باشد.' }, { status: 400 });
  const { id } = await params;
  const updated = await prisma.businessClient.updateMany({ where: { id, businessId: business.id }, data: { photo: new Uint8Array(photo.bytes), photoType: photo.type } });
  if (!updated.count) {
    const reservation = await prisma.businessReservation.findFirst({ where: { businessId: business.id, customerId: id }, select: { id: true } });
    if (!reservation) return Response.json({ error: 'مشتری پیدا نشد.' }, { status: 404 });
    const identityKey = createHash('sha256').update(JSON.stringify([business.id, id])).digest('hex');
    await prisma.businessClientPhoto.upsert({ where: { identityKey }, create: { identityKey, businessId: business.id, customerId: id, photo: new Uint8Array(photo.bytes), photoType: photo.type }, update: { photo: new Uint8Array(photo.bytes), photoType: photo.type } });
  }
  return Response.json({ ok: true });
}
