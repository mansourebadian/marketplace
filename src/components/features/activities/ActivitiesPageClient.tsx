'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cancelReservation } from '@/actions/reservation.actions';
import { useEffect, useState } from 'react';
import { Calendar } from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorianEn from 'react-date-object/locales/gregorian_en';
import { matchesReservationFilter, type ReservationFilter } from '@/lib/reservation-filters';
import {
  CalendarDays,
  ClipboardList,
  Heart,
  MessageCircle,
  Search,
  Settings,
  UserRound,
  WalletCards,
} from 'lucide-react';

export interface ActivitiesUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ActivitiesPageClientProps {
  user: ActivitiesUser;
  reservations: { id: string; status: string; total: number; business: { name: string }; items: { serviceName: string; startsAt: string }[] }[];
}

const NAV_ITEMS = [
  { label: 'پروفایل', icon: UserRound, href: '/profile' },
  { label: 'نوبت‌های من', icon: CalendarDays, href: '/activities' },
  { label: 'کیف پول', icon: WalletCards },
  { label: 'پیام‌ها', icon: MessageCircle },
  { label: 'علاقه‌مندی‌ها', icon: Heart },
  { label: 'فرم‌ها', icon: ClipboardList },
  { label: 'تنظیمات', icon: Settings },
] as const;

const TABS = [
  { id: 'appointments', label: 'نوبت‌ها' },
  { id: 'gifts', label: 'کارت هدیه' },
  { id: 'products', label: 'محصولات' },
  { id: 'packages', label: 'پکیج‌ها' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const RESERVATION_FILTERS: { id: ReservationFilter; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'upcoming', label: 'سررسید نشده' },
  { id: 'past', label: 'گذشته' },
  { id: 'cancelled', label: 'لغوشده' },
  { id: 'test', label: 'آزمایشی' },
];

const EMPTY_STATES: Record<
  TabId,
  { title: string; description: string; actionLabel?: string; actionHref?: string }
> = {
  appointments: {
    title: 'نوبتی وجود ندارد',
    description: 'نوبت‌های آینده و گذشته شما اینجا نمایش داده می‌شود.',
    actionLabel: 'جستجوی سالن‌ها',
    actionHref: '/',
  },
  gifts: {
    title: 'کارت هدیه‌ای وجود ندارد',
    description: 'کارت‌های هدیه خریداری یا دریافت‌شده شما اینجا نمایش داده می‌شود.',
  },
  products: {
    title: 'محصولی وجود ندارد',
    description: 'محصولات خریداری‌شده شما اینجا نمایش داده می‌شود.',
  },
  packages: {
    title: 'پکیجی وجود ندارد',
    description: 'پکیج‌های خریداری‌شده شما اینجا نمایش داده می‌شود.',
  },
};

export function ActivitiesPageClient({ user, reservations }: ActivitiesPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('appointments');
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationFilter>('all');
  const [date, setDate] = useState<DateObject | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);
  const dateKey = date ? new DateObject(date).convert(gregorian, gregorianEn).format('YYYY-MM-DD') : '';
  const filteredReservations = reservations.filter(reservation => matchesReservationFilter(reservation, filter, dateKey, now));
  const displayName = user?.name?.trim() || user?.email || 'کاربر آرینو';
  const emptyState = EMPTY_STATES[activeTab];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] pt-16 md:min-h-[calc(100vh-5rem)] md:pt-20">
      <aside className="hidden w-64 shrink-0 border-l border-gray-200 bg-white lg:block">
        <div className="sticky top-20 p-5">
          <p className="mb-4 truncate px-3 text-lg font-black text-gray-950" dir="auto">
            {displayName}
          </p>
          <nav aria-label="منوی حساب کاربری" className="space-y-1">
            {NAV_ITEMS.map(({ label, icon: Icon, ...item }) => {
              if (!('href' in item)) {
                return (
                  <button
                    key={label}
                    type="button"
                    disabled
                    title="به‌زودی"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 disabled:cursor-default"
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                );
              }

              const isActive = pathname === item.href;

              return (
                <Link
                  key={label}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-[#f7f7f8] px-4 py-7 sm:px-6 md:py-10 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">نوبت‌های من</h1>
              <p className="mt-2 text-sm text-gray-500">
                نوبت‌های خود را ببینید و تا ۲۴ ساعت پیش از شروع، آن‌ها را لغو کنید.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 lg:hidden"
            >
              خانه
            </Link>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto border-b border-gray-200">
            {TABS.map(({ id, label }) => {
              const isActive = activeTab === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-pressed={isActive}
                  className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {activeTab === 'appointments' && <section aria-label="فیلتر نوبت‌ها" className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <h2 className="mb-3 font-bold">فیلتر نوبت‌ها</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="وضعیت نوبت">
              {RESERVATION_FILTERS.map(option => <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => { setFilter(option.id); setExpandedId(null); setError(''); }} className={`rounded-full border px-4 py-2 text-sm font-semibold ${filter === option.id ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-700 hover:border-gray-600'}`}>{option.label}</button>)}
            </div>
            <div className="relative mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">تاریخ نوبت</span>
              <button type="button" aria-expanded={dateOpen} aria-controls="reservation-date-picker" onClick={() => setDateOpen(open => !open)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:border-gray-600">{date ? date.format('D MMMM YYYY') : 'انتخاب تاریخ'}</button>
              {date && <button type="button" onClick={() => { setDate(null); setDateOpen(false); }} className="text-sm text-indigo-700 underline">پاک کردن تاریخ</button>}
              {dateOpen && <div id="reservation-date-picker" className="absolute right-0 top-full z-20 mt-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg"><Calendar value={date} onChange={value => { setDate(value); setDateOpen(false); setExpandedId(null); setError(''); }} calendar={persian} locale={persianFa} shadow={false} /></div>}
            </div>
          </section>}

          {activeTab === 'appointments' && filteredReservations.length > 0 ? <section className="space-y-3" aria-label="نوبت‌های شما">
            {filteredReservations.map(reservation => <article key={reservation.id} className="rounded-2xl border border-gray-200 bg-white">
              <button type="button" aria-expanded={expandedId === reservation.id} aria-controls={`reservation-${reservation.id}`} onClick={() => { setExpandedId(current => current === reservation.id ? null : reservation.id); setError(''); }} className="block w-full rounded-2xl p-6 text-right hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              <div className="flex flex-wrap justify-between gap-3"><span className="font-bold">{reservation.business.name}</span><span className="text-sm">{({ CONFIRMED: 'تأییدشده', TEST_CONFIRMED: 'آزمایشی', CANCELLED: 'لغوشده', COMPLETED: 'انجام‌شده', NO_SHOW: 'عدم حضور' } as Record<string, string>)[reservation.status] || reservation.status}</span></div>
              {reservation.items[0] && <p className="mt-3 text-sm text-gray-600">{new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', dateStyle: 'full', timeStyle: 'short' }).format(new Date(reservation.items[0].startsAt))}</p>}
              <p className="mt-2 text-sm text-gray-600">{reservation.items.map(item => item.serviceName).join('، ')}</p>
              <span className="mt-4 block text-sm font-semibold text-indigo-700">{expandedId === reservation.id ? 'بستن جزئیات' : 'مشاهده جزئیات نوبت'}</span>
              </button>
              {expandedId === reservation.id && <div id={`reservation-${reservation.id}`} className="border-t border-gray-200 px-6 pb-6 pt-4">
              <h2 className="font-bold">جزئیات نوبت</h2>
              <p className="mt-3 text-sm">مبلغ: {reservation.total.toLocaleString('fa-IR')} تومان</p>
              <p className="mt-2 text-sm text-gray-600">شناسه نوبت: <bdi>{reservation.id}</bdi></p>
              {reservation.status === 'CONFIRMED' && <p className="mt-3 text-sm text-gray-600">لغو آنلاین تا ۲۴ ساعت پیش از شروع نوبت امکان‌پذیر است.</p>}
              {reservation.status === 'CONFIRMED' && reservation.items[0] && <button type="button" disabled={!!pending} onClick={async () => { if (!window.confirm('این نوبت لغو شود؟')) return; setPending(reservation.id); setError(''); try { const result = await cancelReservation(reservation.id); if (result.error) setError(result.error); else router.refresh(); } catch { setError('لغو نوبت انجام نشد. دوباره تلاش کنید.'); } finally { setPending(''); } }} className="mt-4 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">{pending === reservation.id ? 'در حال لغو…' : 'لغو نوبت'}</button>}
              {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
              </div>}
            </article>)}
          </section> : <section className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <CalendarDays className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-lg font-black text-gray-950">{activeTab === 'appointments' && reservations.length > 0 ? 'نوبتی با این فیلترها پیدا نشد' : emptyState.title}</h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-gray-500">
              {activeTab === 'appointments' && reservations.length > 0 ? 'وضعیت یا تاریخ دیگری انتخاب کنید.' : emptyState.description}
            </p>
            {!(activeTab === 'appointments' && reservations.length > 0) && emptyState.actionLabel && emptyState.actionHref && (
              <Link
                href={emptyState.actionHref}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
              >
                <Search className="h-4 w-4" />
                {emptyState.actionLabel}
              </Link>
            )}
          </section>}
        </div>
      </main>
    </div>
  );
}
