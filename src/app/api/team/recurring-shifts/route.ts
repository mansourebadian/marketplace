import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const parsed = new Date(`${value}T00:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; });
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const schema = z.object({ memberKey: z.string().min(1).max(36), startDate: date, endDate: date.nullable(), interval: z.union([z.literal(1), z.literal(2)]), days: z.array(z.array(z.object({ start: time, end: time }).refine(p => p.start < p.end)).max(10)).length(7) }).refine(value => !value.endDate || value.endDate >= value.startDate).refine(value => value.days.every(day => { const sorted = [...day].sort((a, b) => a.start.localeCompare(b.start)); return sorted.every((period, i) => i === 0 || sorted[i - 1].end <= period.start); }));

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: 'اطلاعات معتبر نیست.' }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'تاریخ یا ساعات واردشده معتبر نیستند؛ ساعت‌ها نباید با هم تداخل داشته باشند.' }, { status: 400 });
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true } });
  if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
  const { memberKey, startDate, endDate, interval, days } = parsed.data;
  if (memberKey !== 'owner' && !await prisma.businessTeamMember.findFirst({ where: { id: memberKey, businessId: business.id }, select: { id: true } })) return Response.json({ error: 'عضو تیم پیدا نشد.' }, { status: 404 });
  try {
    await prisma.businessRecurringShift.upsert({ where: { businessId_memberKey_startDate: { businessId: business.id, memberKey, startDate } }, create: { businessId: business.id, memberKey, startDate, endDate, interval, days: JSON.stringify(days) }, update: { endDate, interval, days: JSON.stringify(days) } });
    return Response.json({ success: true });
  } catch (error) { console.error('Saving recurring shifts failed', error); return Response.json({ error: 'ذخیره برنامه انجام نشد.' }, { status: 500 }); }
}
