import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { verifyTeamPhotoToken } from '@/lib/team-photo-token';

const optionalText = (max: number) => z.string().trim().max(max).transform(value => value || null);
const date = z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value)), 'تاریخ معتبر نیست.').transform(value => value ? new Date(`${value}T00:00:00Z`) : null);
const schema = z.object({
  firstName: z.string().trim().min(1, 'نام را وارد کنید.').max(100), lastName: optionalText(100), email: z.string().trim().email('ایمیل معتبر وارد کنید.').max(320),
  phone: optionalText(32), additionalPhone: optionalText(32), country: optionalText(100), birthday: date, gender: optionalText(64), pronouns: optionalText(64),
  color: z.string().regex(/^#[0-9a-f]{6}$/i), jobTitle: optionalText(255), startDate: date, endDate: date, employmentType: optionalText(64), externalId: optionalText(100), notes: optionalText(1000), photoToken: z.string().max(2048),
}).refine(value => !value.startDate || !value.endDate || value.endDate >= value.startDate, { message: 'تاریخ پایان باید پس از تاریخ شروع باشد.' });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  let data: unknown;
  try { data = await request.json(); } catch { return Response.json({ error: 'اطلاعات معتبر نیست.' }, { status: 400 }); }
  const parsed = schema.safeParse(data);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || 'اطلاعات معتبر نیست.' }, { status: 400 });
  const { photoToken, ...member } = parsed.data;
  const imageName = photoToken ? verifyTeamPhotoToken(photoToken, session.user.id) : null;
  if (photoToken && !imageName) return Response.json({ error: 'تصویر معتبر نیست یا مهلت آن به پایان رسیده است. دوباره تصویر را انتخاب کنید.' }, { status: 400 });
  try {
    const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
    if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
    await prisma.businessTeamMember.create({ data: { ...member, imageName, businessId: business.id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Team member creation failed', error);
    return Response.json({ error: 'ثبت عضو تیم انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
