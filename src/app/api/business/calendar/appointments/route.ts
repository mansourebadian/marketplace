import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') return Response.json({ error: 'دسترسی غیرمجاز است.' }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(from) || !valid(to)) return Response.json({ error: 'بازه تاریخ معتبر نیست.' }, { status: 400 });
  const start = new Date(`${from}T00:00:00+03:30`);
  const end = new Date(`${to}T00:00:00+03:30`);
  if (end <= start || end.getTime() - start.getTime() > 100 * 86_400_000) return Response.json({ error: 'بازه تاریخ معتبر نیست.' }, { status: 400 });
  try {
    const items = await prisma.businessReservationItem.findMany({
      where: { reservation: { business: { ownerId: session.user.id }, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } }, startsAt: { lt: end }, endsAt: { gt: start } },
      select: { id: true, memberKey: true, serviceName: true, startsAt: true, endsAt: true, reservation: { select: { status: true, firstVisit: true, note: true, customer: { select: { name: true, phone: true } } } } },
      orderBy: { startsAt: 'asc' },
    });
    return Response.json({ appointments: items.map(item => ({ id: item.id, memberKey: item.memberKey, serviceName: item.serviceName, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString(), customerName: item.reservation.customer.name || item.reservation.customer.phone || 'مشتری', firstVisit: item.reservation.firstVisit, note: item.reservation.note, isTest: item.reservation.status === 'TEST_CONFIRMED' })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Loading calendar appointments failed', error);
    return Response.json({ error: 'دریافت نوبت‌ها انجام نشد.' }, { status: 500 });
  }
}
