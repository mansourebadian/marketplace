import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { businessAvailableStarts, businessProfessionals } from '@/lib/business-availability';
import { assignBookingServices } from '@/lib/booking-assignment';

type TestBookingInput = { businessId: string; requestId: string; start: number; firstVisit: boolean; note: string; services: { id: string; memberKey: string }[] };

export async function createTestBookingRecord(input: TestBookingInput, customerId: string, status: 'TEST_CONFIRMED' | 'CONFIRMED' = 'TEST_CONFIRMED'): Promise<{ id?: string; error?: string }> {
  const { businessId, requestId, start, services: requested, firstVisit, note } = input;
  const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(start));
  const part = (name: string) => dateParts.find(item => item.type === name)?.value;
  const date = `${part('year')}-${part('month')}-${part('day')}`;
  const dayStart = new Date(`${date}T00:00:00+03:30`);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        // Serialize booking decisions within a business, including initially empty schedules.
        const locked = await tx.$queryRaw<{ id: string }[]>`SELECT [id] FROM [dbo].[Business] WITH (UPDLOCK, HOLDLOCK) WHERE [id] = ${businessId}`;
        if (!locked.length) return { error: 'مجموعه پیدا نشد.' };
        const existing = await tx.businessReservation.findUnique({ where: { requestId }, select: { id: true, customerId: true, businessId: true } });
        if (existing) return existing.customerId === customerId && existing.businessId === businessId ? { id: existing.id } : { error: 'درخواست رزرو معتبر نیست.' };
        const business = await tx.business.findFirst({ where: { id: businessId, businessAddress: { not: null } }, select: {
          teamMembers: { select: { id: true } },
          services: { where: { id: { in: requested.map(service => service.id) } }, select: { id: true, name: true, durationMin: true, price: true, priceType: true } },
          shifts: { where: { date }, select: { memberKey: true, date: true, startTime: true, endTime: true } },
          recurringShifts: { where: { startDate: { lte: date } }, select: { memberKey: true, startDate: true, endDate: true, interval: true, days: true } },
          memberServices: { select: { memberKey: true, serviceIds: true } },
        } });
        if (!business) return { error: 'مجموعه پیدا نشد.' };
        const services = requested.map(item => {
          const service = business.services.find(entry => entry.id === item.id);
          return service ? { ...service, memberKey: item.memberKey } : null;
        });
        if (services.some(item => !item)) return { error: 'خدمات انتخاب‌شده معتبر نیست.' };
        const validServices = services.filter((item): item is NonNullable<typeof item> => item !== null);
        const reservations = await tx.businessReservationItem.findMany({ where: { reservation: { businessId, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } }, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } }, select: { memberKey: true, startsAt: true, endsAt: true } });
        const availability = { date, services: validServices, memberKeys: ['owner', ...business.teamMembers.map(member => member.id)], shifts: business.shifts, recurringShifts: business.recurringShifts, assignments: business.memberServices, busy: reservations.map(item => ({ memberKey: item.memberKey, start: item.startsAt.getTime(), end: item.endsAt.getTime() })), now: Date.now() };
        if (!businessAvailableStarts(availability).includes(start)) return { error: 'این زمان دیگر در دسترس نیست. زمان دیگری انتخاب کنید.' };
        const assigned = assignBookingServices(validServices, businessProfessionals(availability), start);
        if (!assigned) return { error: 'متخصص انتخاب‌شده دیگر در این زمان در دسترس نیست.' };
        const reservation = await tx.businessReservation.create({ data: {
          requestId, businessId, customerId, status, firstVisit, note: note.trim() || null,
          total: validServices.reduce((sum, service) => sum + (service.priceType === 'FREE' ? 0 : service.price), 0),
          items: { create: assigned.map((item, position) => ({ memberKey: item.memberKey, serviceId: item.serviceId, serviceName: validServices[position].name, position, startsAt: new Date(item.start), endsAt: new Date(item.end), price: validServices[position].priceType === 'FREE' ? 0 : validServices[position].price })) },
        }, select: { id: true } });
        return { id: reservation.id };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
      console.error('Test booking failed', error);
      return { error: 'ثبت آزمایشی نوبت انجام نشد. دوباره تلاش کنید.' };
    }
  }
  return { error: 'ثبت آزمایشی نوبت انجام نشد. دوباره تلاش کنید.' };
}
