import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({ role: z.enum(['none', 'basic', 'low', 'medium', 'high']) });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'اطلاعات معتبر نیست.' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'نقش انتخاب‌شده معتبر نیست.' }, { status: 400 });
  const { id } = await context.params;
  try {
    const result = await prisma.businessTeamMember.updateMany({ where: { id, business: { ownerId: session.user.id } }, data: { permissionRole: parsed.data.role } });
    if (!result.count) return Response.json({ error: 'عضو تیم پیدا نشد.' }, { status: 404 });
    return Response.json({ role: parsed.data.role });
  } catch (error) {
    console.error('Team member permission role update failed', error);
    return Response.json({ error: 'ذخیره نقش انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
