'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
}

const NAV_ITEMS = [
  { label: 'پروفایل', icon: UserRound, href: '/profile' },
  { label: 'فعالیت‌ها', icon: CalendarDays, href: '/activities' },
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

export function ActivitiesPageClient({ user }: ActivitiesPageClientProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>('appointments');
  const displayName = user?.name?.trim() || user?.email || 'کاربر فرشا';
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
              <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">فعالیت‌ها</h1>
              <p className="mt-2 text-sm text-gray-500">
                نوبت‌ها و خریدهای خود را از این بخش دنبال کنید.
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

          <section className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <CalendarDays className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-lg font-black text-gray-950">{emptyState.title}</h2>
            <p className="mt-2 max-w-md text-sm leading-7 text-gray-500">
              {emptyState.description}
            </p>
            {emptyState.actionLabel && emptyState.actionHref && (
              <Link
                href={emptyState.actionHref}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
              >
                <Search className="h-4 w-4" />
                {emptyState.actionLabel}
              </Link>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
