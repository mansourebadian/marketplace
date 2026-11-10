import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { businessAvailableStarts } from '@/lib/business-availability';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || '';
  const serviceIds = (url.searchParams.get('services') || '').split(',').filter(Boolean);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || !z.array(z.string().min(1).max(36)).min(1).max(50).safeParse(serviceIds).success || new Set(serviceIds).size !== serviceIds.length) return Response.json({ error: 'تاریخ یا خدمات انتخاب‌شده معتبر نیست.' }, { status: 400 });
  try {
    const business = await prisma.business.findFirst({ where: { id, businessAddress: { not: null } }, select: { id: true, teamMembers: { select: { id: true } }, services: { where: { id: { in: serviceIds } }, select: { id: true, durationMin: true } }, shifts: { where: { date }, select: { memberKey: true, date: true, startTime: true, endTime: true } }, recurringShifts: { where: { startDate: { lte: date } }, select: { memberKey: true, startDate: true, endDate: true, interval: true, days: true } }, memberServices: { select: { memberKey: true, serviceIds: true } } } });
    if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
    const services = serviceIds.map(serviceId => business.services.find(service => service.id === serviceId));
    if (services.some(service => !service)) return Response.json({ error: 'خدمات انتخاب‌شده معتبر نیست.' }, { status: 400 });
    const slots = businessAvailableStarts({ date, services: services.filter((service): service is NonNullable<typeof service> => !!service), memberKeys: ['owner', ...business.teamMembers.map(member => member.id)], shifts: business.shifts, recurringShifts: business.recurringShifts, assignments: business.memberServices, now: Date.now() });
    return Response.json({ slots }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { console.error('Loading business availability failed', error); return Response.json({ error: 'دریافت ساعت‌های آزاد انجام نشد. دوباره تلاش کنید.' }, { status: 500 }); }
}
