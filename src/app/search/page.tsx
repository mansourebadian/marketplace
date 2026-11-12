import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import prisma from '@/lib/prisma';
import { formatBusinessAddress } from '@/lib/business-address';
import { businessAvailableStarts } from '@/lib/business-availability';
import { businessAddressFields, matchesSearch } from '@/lib/search-matching';

type Params = { q?: string | string[]; location?: string | string[]; date?: string | string[]; time?: string | string[] };
const value = (input: string | string[] | undefined) => (typeof input === 'string' ? input.trim().slice(0, 200) : '');

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = value(params.q);
  const location = value(params.location);
  const date = value(params.date);
  const time = value(params.time);
  const validDate = !date || (/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date);
  let results: { id: string; name: string; address: string; href: string }[] | null = null;
  try {
    if (!validDate) throw new Error('Invalid search date');
    const [salons, businesses] = await Promise.all([
      prisma.salon.findMany({
        include: { services: { select: { name: true, category: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.business.findMany({
        where: { businessAddress: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, businessAddress: true, businessLocation: true,
          services: { select: { id: true, name: true, durationMin: true, treatmentType: { select: { name: true, groupName: true } } } },
          teamMembers: { select: { id: true } },
          shifts: { where: { date }, select: { memberKey: true, date: true, startTime: true, endTime: true } },
          recurringShifts: { where: { startDate: { lte: date } }, select: { memberKey: true, startDate: true, endDate: true, interval: true, days: true } },
          memberServices: { select: { memberKey: true, serviceIds: true } },
        },
      }),
    ]);
    const matchingSalons = salons.filter(salon =>
      matchesSearch(q, [salon.name, ...salon.services.flatMap(service => [service.name, service.category?.name])]) && matchesSearch(location, [salon.address]));
    const candidates = businesses.filter(business =>
      matchesSearch(q, [business.name, ...business.services.flatMap(service => [service.name, service.treatmentType?.name, service.treatmentType?.groupName])]) && matchesSearch(location, businessAddressFields(business.businessAddress, business.businessLocation)));
    const dayStart = date ? new Date(`${date}T00:00:00+03:30`) : null;
    const reservations = dayStart ? await prisma.businessReservationItem.findMany({
      where: { reservation: { businessId: { in: candidates.map(b => b.id) }, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } }, startsAt: { lt: new Date(dayStart.getTime() + 86_400_000) }, endsAt: { gt: dayStart } },
      select: { memberKey: true, startsAt: true, endsAt: true, reservation: { select: { businessId: true } } },
    }) : [];
    const matchingBusinesses = date ? candidates.filter(business => {
      const nameMatches = matchesSearch(q, [business.name]);
      const services = business.services.filter(service => nameMatches || matchesSearch(q, [service.name, service.treatmentType?.name, service.treatmentType?.groupName]));
      const busy = reservations.filter(item => item.reservation.businessId === business.id).map(item => ({ memberKey: item.memberKey, start: item.startsAt.getTime(), end: item.endsAt.getTime() }));
      return services.some(service => businessAvailableStarts({ date, services: [service], memberKeys: ['owner', ...business.teamMembers.map(member => member.id)], shifts: business.shifts, recurringShifts: business.recurringShifts, assignments: business.memberServices, busy, now: Date.now() }).some(slot => {
        const hour = new Date(slot + 210 * 60_000).getUTCHours();
        return time === 'morning' ? hour >= 9 && hour < 12 : time === 'afternoon' ? hour >= 12 && hour < 17 : time === 'evening' ? hour >= 17 : true;
      }));
    }) : candidates;
    results = [
      ...(!date ? matchingSalons : []).map(salon => ({ id: salon.id, name: salon.name, address: salon.address, href: `/salon/${salon.id}` })),
      ...matchingBusinesses.map(business => ({ id: business.id, name: business.name, address: formatBusinessAddress(business.businessAddress, business.businessLocation) || 'آدرس ثبت نشده است', href: `/salon/${business.id}?source=business` })),
    ];
  } catch (error) {
    console.error('Error searching salons:', error);
  }
  return <main className="min-h-screen bg-white">
    <Header hasSearch />
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-28 md:px-8">
      <h1 className="text-3xl font-bold">نتایج جستجو</h1>
      {(q || location) && <p className="mt-3 text-gray-600">{[q, location].filter(Boolean).join(' · ')}</p>}
      {date && validDate && <p className="mt-4 text-sm text-gray-600">فقط مراکز دارای نوبت آزاد در تاریخ انتخابی نمایش داده می‌شوند.</p>}
      {!date && time && <p className="mt-4 text-sm text-gray-600">برای فیلتر ساعت، ابتدا تاریخ را انتخاب کنید.</p>}
      {results === null ? <p className="mt-10 text-gray-600">دریافت نتایج در حال حاضر امکان‌پذیر نیست. لطفاً دوباره تلاش کنید.</p> : results.length === 0 ? <p className="mt-10 text-gray-600">نتیجه‌ای پیدا نشد. عبارت یا مکان دیگری را امتحان کنید.</p> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map(result => <Link key={result.href} href={result.href} className="rounded-2xl border border-gray-200 p-5 transition-shadow hover:shadow-md"><h2 className="font-bold">{result.name}</h2><p className="mt-2 text-sm text-gray-600">{result.address}</p></Link>)}</div>}
    </div>
  </main>;
}
