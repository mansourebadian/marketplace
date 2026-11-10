import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  memberKey: z.string().min(1).max(36),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const date = new Date(`${value}T00:00:00Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
}).refine(value => (value.startTime === null && value.endTime === null) || (value.startTime !== null && value.endTime !== null && value.endTime > value.startTime));

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: 'اطلاعات معتبر نیست.' }, { status: 400 }); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return Response.json({ error: 'تاریخ یا ساعت شیفت معتبر نیست.' }, { status: 400 });
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
  const { memberKey, date, startTime, endTime } = parsed.data;
  if (memberKey !== 'owner' && !await prisma.businessTeamMember.findFirst({ where: { id: memberKey, businessId: business.id }, select: { id: true } })) return Response.json({ error: 'عضو تیم پیدا نشد.' }, { status: 404 });
  try {
    const shift = await prisma.businessShift.upsert({ where: { businessId_memberKey_date: { businessId: business.id, memberKey, date } }, create: { businessId: business.id, memberKey, date, startTime, endTime }, update: { startTime, endTime }, select: { memberKey: true, date: true, startTime: true, endTime: true } });
    return Response.json(shift);
  } catch (error) {
    console.error('Saving shift failed', error);
    return Response.json({ error: 'ذخیره شیفت انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
