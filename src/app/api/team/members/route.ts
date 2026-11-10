import { teamMemberSchema } from '@/lib/team-member-schema';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { verifyTeamPhotoToken } from '@/lib/team-photo-token';


export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  let data: unknown;
  try { data = await request.json(); } catch { return Response.json({ error: 'اطلاعات معتبر نیست.' }, { status: 400 }); }
  const parsed = teamMemberSchema.safeParse(data);
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
