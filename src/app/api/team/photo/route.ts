import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createTeamPhotoToken } from '@/lib/team-photo-token';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
  let file: FormDataEntryValue | null;
  try { file = (await request.formData()).get('image'); } catch { return Response.json({ error: 'تصویر معتبر نیست.' }, { status: 400 }); }
  if (!(file instanceof File) || file.type !== 'image/png' || file.size < 8 || file.size > 5 * 1024 * 1024) return Response.json({ error: 'تصویر انتخاب‌شده معتبر نیست.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (![137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return Response.json({ error: 'فرمت تصویر معتبر نیست.' }, { status: 400 });
  try {
    const base = process.env.IMAGE_SERVER_URL || process.env.NEXT_PUBLIC_IMAGE_SERVER_URL || 'http://localhost:4001';
    const response = await fetch(`${base.replace(/\/$/, '')}/images`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: file, cache: 'no-store' });
    if (!response.ok) throw new Error('Image server rejected upload');
    const result: unknown = await response.json();
    const name = typeof result === 'object' && result !== null && 'name' in result ? result.name : null;
    if (typeof name !== 'string' || !/^[0-9a-f-]{36}\.png$/i.test(name)) throw new Error('Invalid image server response');
    return Response.json({ token: createTeamPhotoToken(name, session.user.id) });
  } catch (error) {
    console.error('Team photo upload failed', error);
    return Response.json({ error: 'بارگذاری تصویر انجام نشد. دوباره تلاش کنید.' }, { status: 502 });
  }
}
