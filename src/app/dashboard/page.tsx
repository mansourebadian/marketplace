import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarDays, ChartNoAxesCombined, TrendingUp, UsersRound } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import styles from './dashboard.module.css';

export const metadata: Metadata = { title: 'خانه کسب‌وکار | آرینو' };

const dateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
const dateLabel = (date: Date) => new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(date);
const number = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, name: true, businessAddress: true, teamMembers: { select: { id: true, firstName: true, lastName: true } } } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  const now = new Date();
  const today = dateKey(now);
  const month = today.slice(0, 7);
  const [year, monthNumber] = month.split('-').map(Number);
  const previousMonth = new Date(Date.UTC(year, monthNumber - 2, 15)).toISOString().slice(0, 7);
  const start = new Date(Date.UTC(year, monthNumber - 2, 1) - 24 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, monthNumber, 1) + 24 * 60 * 60 * 1000);
  const [recent, periodItems] = await Promise.all([
    prisma.businessReservationItem.findMany({ where: { reservation: { businessId: business.id, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } } }, select: { id: true, memberKey: true, serviceName: true, startsAt: true, endsAt: true, reservation: { select: { status: true, customer: { select: { name: true, phone: true } } } } }, orderBy: { reservation: { createdAt: 'desc' } }, take: 5 }),
    prisma.businessReservationItem.findMany({ where: { reservation: { businessId: business.id, status: { in: ['CONFIRMED', 'TEST_CONFIRMED'] } }, startsAt: { gte: start, lt: end } }, select: { id: true, memberKey: true, serviceName: true, startsAt: true, endsAt: true, price: true, reservation: { select: { status: true, customer: { select: { name: true, phone: true } } } } }, orderBy: { startsAt: 'asc' } }),
  ]);
  const confirmedItems = periodItems.filter(item => item.reservation.status === 'CONFIRMED');
  const currentItems = confirmedItems.filter(item => dateKey(item.startsAt).startsWith(month));
  const previousItems = confirmedItems.filter(item => dateKey(item.startsAt).startsWith(previousMonth));
  const upcoming = periodItems.filter(item => dateKey(item.startsAt) === today && item.startsAt >= now).slice(0, 5);
  const serviceCounts = new Map<string, { current: number; previous: number }>();
  for (const [items, key] of [[currentItems, 'current'], [previousItems, 'previous']] as const) for (const item of items) {
    const counts = serviceCounts.get(item.serviceName) ?? { current: 0, previous: 0 };
    counts[key]++;
    serviceCounts.set(item.serviceName, counts);
  }
  const topServices = [...serviceCounts].sort((a, b) => b[1].current - a[1].current || b[1].previous - a[1].previous).slice(0, 5);
  const memberName = (key: string) => { if (key === 'owner') return session.user.name || business.name; const member = business.teamMembers.find(member => member.id === key); return member ? [member.firstName, member.lastName].filter(Boolean).join(' ') : 'عضو حذف‌شده'; };
  const teamCounts = new Map<string, { current: number; previous: number }>();
  for (const [items, key] of [[currentItems, 'current'], [previousItems, 'previous']] as const) for (const item of items) {
    const counts = teamCounts.get(item.memberKey) ?? { current: 0, previous: 0 };
    counts[key]++;
    teamCounts.set(item.memberKey, counts);
  }
  const topTeam = [...teamCounts].sort((a, b) => b[1].current - a[1].current || b[1].previous - a[1].previous).slice(0, 5);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(new Date(`${today}T12:00:00+03:30`).getTime() - (6 - index) * 86400000);
    const key = dateKey(date);
    return { key, label: new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'short' }).format(date), count: confirmedItems.filter(item => dateKey(item.startsAt) === key).length };
  });
  const maxDay = Math.max(1, ...days.map(day => day.count));
  const bookedValue = currentItems.reduce((sum, item) => sum + item.price, 0);
  const previousValue = previousItems.reduce((sum, item) => sum + item.price, 0);
  type Item = typeof recent[number];
  const appointments = (items: Item[], empty: string) => items.length ? <div className={styles.appointments}>{items.map(item => <div className={styles.appointment} key={item.id}><div className={styles.dateBadge}>{new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', day: 'numeric', month: 'short' }).format(item.startsAt)}</div><div><div className={styles.meta}>{dateLabel(item.startsAt)} <span className={styles.badge}>{item.reservation.status === 'TEST_CONFIRMED' ? 'آزمایشی' : 'رزرو شده'}</span></div><strong>{item.serviceName}</strong><p>{item.reservation.customer.name || item.reservation.customer.phone || 'مشتری'} · {number(Math.round((item.endsAt.getTime() - item.startsAt.getTime()) / 60000))} دقیقه{memberName(item.memberKey) && ` با ${memberName(item.memberKey)}`}</p></div></div>)}</div> : <div className={styles.empty}><CalendarDays size={36} /><strong>{empty}</strong><span>نوبت‌های ثبت‌شده در اینجا نمایش داده می‌شوند.</span></div>;

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/dashboard" label="خانه کسب‌وکار"><div className={styles.page}><div className={styles.container}>
    <div className={styles.heading}><div><h1>خانه</h1><p>نمای کلی کسب‌وکار {business.name}</p></div><Link href="/calendar" className={styles.calendarLink}>مشاهده تقویم</Link></div>
    <div className={styles.grid}>
      <section className={styles.card}><h2>نمای کلی نوبت‌ها</h2><p className={styles.subtitle}>خدمات رزرو شده در ۷ روز گذشته</p><div className={styles.chart} role="img" aria-label={`تعداد خدمات رزرو شده در هفت روز گذشته: ${days.map(day => `${day.label} ${number(day.count)}`).join('، ')}`}>{days.map(day => <div className={styles.chartColumn} key={day.key}><span>{number(day.count)}</span><div className={styles.barTrack}><div className={styles.bar} style={{ height: `${day.count / maxDay * 100}%` }} /></div><small>{day.label}</small></div>)}</div><div className={styles.legend}><span /> خدمات رزرو شده <small>این ماه: {number(currentItems.length)} · ماه گذشته: {number(previousItems.length)}</small></div></section>
      <section className={styles.card}><h2>ارزش رزروها</h2><p className={styles.subtitle}>مجموع مبلغ خدمات رزرو شده در این ماه میلادی</p><div className={styles.stat}><TrendingUp size={24} /><div><strong>{number(bookedValue)} <small>تومان</small></strong><span>مبلغ رزروهای تأییدشده</span></div></div><div className={styles.valueFooter}>ماه گذشته: {number(previousValue)} تومان<p>این مبلغ نشان‌دهنده فروش یا پرداخت وصول‌شده نیست.</p></div></section>
      <section className={styles.card}><h2>فعالیت نوبت‌ها</h2>{appointments(recent, 'هنوز نوبتی ثبت نشده است')}</section>
      <section className={styles.card}><h2>نوبت‌های بعدی امروز</h2>{appointments(upcoming, 'نوبت دیگری برای امروز ندارید')}</section>
      <section className={styles.card}><h2>خدمات برتر</h2><div className={styles.tableWrap}><table><thead><tr><th>خدمت</th><th>این ماه</th><th>ماه گذشته</th></tr></thead><tbody>{topServices.map(([name, counts]) => <tr key={name}><td>{name}</td><td>{number(counts.current)}</td><td>{number(counts.previous)}</td></tr>)}</tbody></table></div>{!topServices.length && <div className={styles.empty}><ChartNoAxesCombined size={40} /><strong>هنوز خدمتی رزرو نشده است</strong><span>آمار خدمات در اینجا نمایش داده می‌شود.</span></div>}</section>
      <section className={styles.card}><h2>اعضای برتر تیم</h2><p className={styles.tableCaption}>بر اساس تعداد خدمات رزرو شده</p><div className={styles.tableWrap}><table><thead><tr><th>عضو تیم</th><th>این ماه</th><th>ماه گذشته</th></tr></thead><tbody>{topTeam.map(([key, counts]) => <tr key={key}><td>{memberName(key)}</td><td>{number(counts.current)}</td><td>{number(counts.previous)}</td></tr>)}</tbody></table></div>{!topTeam.length && <div className={styles.empty}><UsersRound size={40} /><strong>هنوز خدمتی رزرو نشده است</strong><span>عملکرد اعضای تیم در اینجا نمایش داده می‌شود.</span></div>}</section>
    </div>
  </div></div></BusinessWorkspace>;
}
