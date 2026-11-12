export type ReservationFilter = 'all' | 'upcoming' | 'past' | 'cancelled' | 'test';

export function matchesReservationFilter(reservation: { status: string; items: { startsAt: string }[] }, filter: ReservationFilter, date: string, now: number): boolean {
  const start = reservation.items[0]?.startsAt;
  if (date) {
    if (!start) return false;
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(start));
    const value = (type: string) => parts.find(part => part.type === type)?.value;
    if (`${value('year')}-${value('month')}-${value('day')}` !== date) return false;
  }
  if (filter === 'all') return true;
  if (filter === 'cancelled') return reservation.status === 'CANCELLED';
  if (filter === 'test') return reservation.status === 'TEST_CONFIRMED';
  if (!start) return false;
  const time = new Date(start).getTime();
  if (filter === 'upcoming') return reservation.status === 'CONFIRMED' && time > now;
  return (reservation.status === 'CONFIRMED' && time <= now) || reservation.status === 'COMPLETED' || reservation.status === 'NO_SHOW';
}
