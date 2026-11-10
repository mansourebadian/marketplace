import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { teamMemberSchema } from '@/lib/team-member-schema';
import { verifyTeamPhotoToken } from '@/lib/team-photo-token';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  let data: unknown;
  try { data = await request.json(); } catch { return Response.json({ error: 'اطلاعات معتبر نیست.' }, { status: 400 }); }
  const { id } = await params;
  if (id === 'owner') {
    const ownerSchema = z.object({
      firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().max(100),
      country: z.string().trim().max(100), gender: z.string().trim().max(32),
      birthday: z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value)),
    });
    const parsedOwner = ownerSchema.safeParse(data);
    if (!parsedOwner.success) return Response.json({ error: 'اطلاعات واردشده معتبر نیست.' }, { status: 400 });
    const { firstName, lastName, country, gender, birthday } = parsedOwner.data;
    try {
      const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
      if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
      await prisma.user.update({ where: { id: session.user.id }, data: { firstName, lastName: lastName || null, name: [firstName, lastName].filter(Boolean).join(' '), country: country || null, gender: gender || null, dateOfBirth: birthday ? new Date(birthday + 'T00:00:00Z') : null } });
      return Response.json({ success: true });
    } catch (error) {
      console.error('Owner update failed', error);
      return Response.json({ error: 'ذخیره تغییرات انجام نشد.' }, { status: 500 });
    }
  }
  const parsed = teamMemberSchema.safeParse(data);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || 'اطلاعات معتبر نیست.' }, { status: 400 });
  const { photoToken, ...member } = parsed.data;
  const imageName = photoToken ? verifyTeamPhotoToken(photoToken, session.user.id) : null;
  if (photoToken && !imageName) return Response.json({ error: 'تصویر معتبر نیست یا مهلت آن به پایان رسیده است. دوباره تصویر را انتخاب کنید.' }, { status: 400 });
  try {
    const result = await prisma.businessTeamMember.updateMany({ where: { id, business: { ownerId: session.user.id } }, data: { ...member, ...(imageName ? { imageName } : {}) } });
    if (!result.count) return Response.json({ error: 'عضو تیم پیدا نشد.' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Team member update failed', error);
    return Response.json({ error: 'ذخیره تغییرات انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
