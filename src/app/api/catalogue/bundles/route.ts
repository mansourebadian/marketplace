import { uploadImage } from '@/lib/image-server-upload';
import { auth } from '@/auth';
import { bundleSchema, createBusinessBundle } from '@/actions/business-bundles.actions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 45 * 1024 * 1024;
const extensions: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  let form: FormData;
  try { form = await request.formData(); }
  catch { return Response.json({ error: 'اطلاعات ارسالی معتبر نیست.' }, { status: 400 }); }
  let input: unknown;
  try { input = JSON.parse(String(form.get('bundle'))); }
  catch { return Response.json({ error: 'اطلاعات بسته معتبر نیست.' }, { status: 400 }); }
  const parsed = bundleSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || 'اطلاعات بسته معتبر نیست.' }, { status: 400 });
  let edit: { id: string; retainedImageIds: string[] } | undefined;
  if (form.has('edit')) {
    try {
      const result = z.object({ id: z.string().min(1).max(36), retainedImageIds: z.array(z.string().min(1).max(36)).max(20) }).safeParse(JSON.parse(String(form.get('edit'))));
      if (!result.success) throw new Error('Invalid edit');
      edit = result.data;
    } catch { return Response.json({ error: 'اطلاعات ویرایش معتبر نیست.' }, { status: 400 }); }
    const existing = await prisma.businessBundle.findFirst({ where: { id: edit.id, business: { ownerId: session.user.id } }, select: { images: { select: { id: true } } } });
    if (!existing || new Set(edit.retainedImageIds).size !== edit.retainedImageIds.length || edit.retainedImageIds.some(id => !existing.images.some(image => image.id === id))) return Response.json({ error: 'بسته یا تصاویر آن پیدا نشد.' }, { status: 404 });
  }
  const files = form.getAll('images');
  if (files.length + (edit?.retainedImageIds.length ?? 0) > 20 || files.some(file => !(file instanceof File) || !extensions[file.type] || file.size === 0 || file.size > MAX_IMAGE_SIZE)) {
    return Response.json({ error: 'تصاویر باید از نوع JPG، PNG، AVIF یا WebP و حداکثر ۴۵ مگابایت باشند.' }, { status: 400 });
  }
  const imageNames: string[] = [];
  try {
    for (const item of files) {
      const file = item as File;
      const response = await uploadImage(file);
      if (!response.ok) return Response.json({ error: 'بارگذاری تصویر در سرور تصاویر انجام نشد.' }, { status: 502 });
      const result: unknown = await response.json();
      const name = typeof result === 'object' && result !== null && 'name' in result ? result.name : null;
      if (typeof name !== 'string' || !/^[0-9a-f-]{36}\.(?:jpg|png|webp|avif)$/i.test(name) || !name.toLowerCase().endsWith(extensions[file.type])) {
        return Response.json({ error: 'پاسخ سرور تصاویر معتبر نیست.' }, { status: 502 });
      }
      imageNames.push(name);
    }
    const result = await createBusinessBundle(parsed.data, imageNames, edit);
    return Response.json(result, { status: result.error ? 400 : 200 });
  } catch (error) {
    console.error('Failed to save bundle images', error);
    return Response.json({ error: 'ارتباط با سرور تصاویر یا ذخیره بسته انجام نشد.' }, { status: 502 });
  }
}
