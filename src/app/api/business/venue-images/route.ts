import { uploadImage } from '@/lib/image-server-upload';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
const MAX_SIZE = 45 * 1024 * 1024;
const extensions: Record<string, string[]> = { 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'] };
const namePattern = /^[0-9a-f-]{36}\.(?:jpg|jpeg|png|webp)$/i;

async function ownerBusiness() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return null;
  return prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, businessAddress: true } });
}

function readDetails(value: string | null): Record<string, unknown> {
  try { const data: unknown = JSON.parse(value || '{}'); if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>; } catch { /* Legacy addresses can be plain text. */ }
  return value ? { address: value } : {};
}

function imageNames(details: Record<string, unknown>) { return Array.isArray(details.venueImages) ? details.venueImages.filter((value): value is string => typeof value === 'string' && namePattern.test(value)).slice(0, 10) : []; }

export async function POST(request: Request) {
  const business = await ownerBusiness();
  if (!business) return Response.json({ error: 'دسترسی به کسب‌وکار امکان‌پذیر نیست.' }, { status: 401 });
  let file: FormDataEntryValue | null;
  try { file = (await request.formData()).get('image'); } catch { return Response.json({ error: 'فایل ارسالی معتبر نیست.' }, { status: 400 }); }
  if (!(file instanceof File) || !extensions[file.type] || file.size < 12 || file.size > MAX_SIZE) return Response.json({ error: 'فایل باید تصویر JPG، PNG یا WebP و حداکثر ۴۵ مگابایت باشد.' }, { status: 400 });
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!((file.type === 'image/jpeg' && jpeg) || (file.type === 'image/png' && png) || (file.type === 'image/webp' && webp))) return Response.json({ error: 'محتوای فایل با نوع تصویر مطابقت ندارد.' }, { status: 400 });
  const details = readDetails(business.businessAddress);
  const names = imageNames(details);
  if (names.length >= 10) return Response.json({ error: 'حداکثر ۱۰ تصویر مجاز است.' }, { status: 400 });
  if (JSON.stringify({ ...details, venueImages: [...names, '00000000-0000-0000-0000-000000000000.jpeg'] }).length > 1200) return Response.json({ error: 'فضای ذخیرهٔ اطلاعات کسب‌وکار کافی نیست.' }, { status: 400 });
  if (!process.env.IMAGE_SERVER_TOKEN) return Response.json({ error: 'توکن سرور تصاویر تنظیم نشده است. مقدار IMAGE_SERVER_TOKEN را در تنظیمات سرور برنامه وارد کنید.' }, { status: 503 });
  try {
    const response = await uploadImage(file);
    if (response.status === 401 || response.status === 403) return Response.json({ error: 'سرور تصاویر توکن بارگذاری را نپذیرفت. تنظیمات سرور تصاویر را بررسی کنید.' }, { status: 502 });
    if (!response.ok) throw new Error('Image server rejected upload');
    const result: unknown = await response.json();
    const name = typeof result === 'object' && result !== null && 'name' in result ? result.name : null;
    if (typeof name !== 'string' || !namePattern.test(name) || !extensions[file.type].includes(name.split('.').pop()!.toLowerCase())) throw new Error('Invalid image server response');
    const address = JSON.stringify({ ...details, venueImages: [...names, name] });
    if (address.length > 1200) return Response.json({ error: 'فضای ذخیرهٔ اطلاعات کسب‌وکار کافی نیست.' }, { status: 400 });
    await prisma.business.update({ where: { id: business.id }, data: { businessAddress: address }, select: { id: true } });
    return Response.json({ name });
  } catch (error) { console.error('Venue image upload failed', error); return Response.json({ error: 'بارگذاری تصویر انجام نشد. دوباره تلاش کنید.' }, { status: 502 }); }
}

export async function PATCH(request: Request) {
  const business = await ownerBusiness();
  if (!business) return Response.json({ error: 'دسترسی به کسب‌وکار امکان‌پذیر نیست.' }, { status: 401 });
  let names: unknown;
  try { names = (await request.json()).images; } catch { return Response.json({ error: 'درخواست معتبر نیست.' }, { status: 400 }); }
  const details = readDetails(business.businessAddress);
  const current = imageNames(details);
  if (!Array.isArray(names) || names.length > 10 || names.some(name => typeof name !== 'string' || !current.includes(name)) || new Set(names).size !== names.length) return Response.json({ error: 'فهرست تصاویر معتبر نیست.' }, { status: 400 });
  const address = JSON.stringify({ ...details, venueImages: names });
  if (address.length > 1200) return Response.json({ error: 'فضای ذخیرهٔ اطلاعات کافی نیست.' }, { status: 400 });
  await prisma.business.update({ where: { id: business.id }, data: { businessAddress: address }, select: { id: true } });
  return Response.json({ ok: true });
}
