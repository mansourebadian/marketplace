import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { businessAvailableStarts, businessProfessionals } from '@/lib/business-availability';
import { imageUrl } from '@/lib/image-server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || '';
  const serviceIds = (url.searchParams.get('services') || '').split(',').filter(Boolean);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || !z.array(z.string().min(1).max(36)).min(1).max(50).safeParse(serviceIds).success || new Set(serviceIds).size !== serviceIds.length) return Response.json({ error: 'تاریخ یا خدمات انتخاب‌شده معتبر نیست.' }, { status: 400 });
  try {
    const business = await prisma.business.findFirst({ where: { id, businessAddress: { not: null } }, select: { id: true, teamMembers: { select: { id: true, firstName: true, lastName: true, jobTitle: true, imageName: true }, orderBy: { createdAt: 'asc' } }, owner: { select: { name: true, image: true } }, services: { where: { id: { in: serviceIds } }, select: { id: true, durationMin: true } }, shifts: { where: { date }, select: { memberKey: true, date: true, startTime: true, endTime: true } }, recurringShifts: { where: { startDate: { lte: date } }, select: { memberKey: true, startDate: true, endDate: true, interval: true, days: true } }, memberServices: { select: { memberKey: true, serviceIds: true } } } });
    if (!business) return Response.json({ error: 'کسب‌وکار پیدا نشد.' }, { status: 404 });
    const services = serviceIds.map(serviceId => business.services.find(service => service.id === serviceId));
    if (services.some(service => !service)) return Response.json({ error: 'خدمات انتخاب‌شده معتبر نیست.' }, { status: 400 });
    const dayStart = new Date(`${date}T00:00:00+03:30`);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const reservations = await prisma.businessReservationItem.findMany({ where: { reservation: { businessId: id, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } }, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } }, select: { memberKey: true, startsAt: true, endsAt: true } });
    const busy = reservations.map(item => ({ memberKey: item.memberKey, start: item.startsAt.getTime(), end: item.endsAt.getTime() }));
    const input = { date, services: services.filter((service): service is NonNullable<typeof service> => !!service), memberKeys: ['owner', ...business.teamMembers.map(member => member.id)], shifts: business.shifts, recurringShifts: business.recurringShifts, assignments: business.memberServices, busy, now: Date.now() };
    const slots = businessAvailableStarts(input);
    const professionals = businessProfessionals(input).map(person => {
      const member = business.teamMembers.find(item => item.id === person.id);
      return { ...person, name: person.id === 'owner' ? business.owner.name || 'مدیر مجموعه' : [member?.firstName, member?.lastName].filter(Boolean).join(' '), jobTitle: member?.jobTitle || null, image: person.id === 'owner' ? business.owner.image : member?.imageName ? imageUrl(member.imageName) : null };
    });
    return Response.json({ slots, professionals, hasTeam: business.teamMembers.length > 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { console.error('Loading business availability failed', error); return Response.json({ error: 'دریافت ساعت‌های آزاد انجام نشد. دوباره تلاش کنید.' }, { status: 500 }); }
}
