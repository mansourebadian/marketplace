'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Globe2,
  Heart,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  Settings,
  Smartphone,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { CompactSearchBar } from './CompactSearchBar';

export interface HeaderUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface HeaderClientProps {
  hasSearch?: boolean;
  user: HeaderUser | null;
}

const ACCOUNT_ITEMS = [
  { label: 'پروفایل', icon: UserRound, href: '/profile' },
  { label: 'فعالیت‌ها', icon: CalendarDays, href: '/activities' },
  { label: 'کیف پول', icon: WalletCards },
  { label: 'پیام‌ها', icon: MessageCircle },
  { label: 'علاقه‌مندی‌ها', icon: Heart },
  { label: 'فرم‌ها', icon: ClipboardList },
  { label: 'تنظیمات', icon: Settings },
] as const;

export const HeaderClient = ({
  hasSearch = false,
  user,
}: HeaderClientProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const displayName = user?.name?.trim() || user?.email || 'کاربر فرشا';
  const avatarLetter = displayName.trim().charAt(0).toLocaleUpperCase('fa-IR');

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ redirectTo: '/' });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-colors md:h-20 ${
        hasSearch
          ? 'border-b border-gray-200 bg-white shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="shrink-0 cursor-pointer text-2xl font-bold tracking-tighter text-gray-950"
          dir="ltr"
        >
          fresha
        </Link>

        {hasSearch && <CompactSearchBar />}

        <div
          ref={menuRef}
          className="relative flex shrink-0 items-center gap-2 md:gap-3"
        >
          <Link
            href="/auth/business"
            className="hidden rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 sm:inline-flex"
          >
            فرشا برای متخصصان
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              className="flex max-w-[240px] items-center gap-2 rounded-full border border-gray-300 bg-white p-1 ps-2.5 shadow-sm transition-colors hover:bg-gray-50"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={`تصویر ${
                    user.name?.trim() || 'کاربر'
                  }`}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-base font-bold text-white">
                  {avatarLetter || 'ف'}
                </span>
              )}
              <span
                className="hidden min-w-0 max-w-32 truncate text-sm font-semibold text-gray-950 sm:block"
                dir="auto"
              >
                {displayName}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-gray-700 transition-transform ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <>
              <Link
                href="/auth"
                className="hidden rounded-full bg-black px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 md:inline-flex"
              >
                ورود / ثبت‌نام
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-label="باز کردن منو"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-controls={menuId}
                className="flex items-center justify-center rounded-full border border-gray-200 bg-white p-2.5 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Menu className="h-6 w-6 stroke-[1.5] text-black" />
              </button>
            </>
          )}

          {isMenuOpen &&
            (user ? (
              <div
                id={menuId}
                role="menu"
                className="absolute left-0 top-[calc(100%+0.75rem)] w-[min(310px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white text-right shadow-[0_18px_55px_rgba(0,0,0,0.16)]"
              >
                <div className="border-b border-gray-100 px-5 py-4">
                  <p
                    className="truncate text-[17px] font-bold text-gray-950"
                    dir="auto"
                  >
                    {displayName}
                  </p>
                  {user.email && (
                    <p
                      className="mt-1 truncate text-xs text-gray-500"
                      dir="ltr"
                    >
                      {user.email}
                    </p>
                  )}
                </div>

                <div className="p-2">
                  {ACCOUNT_ITEMS.map((item) => {
                    const { label, icon: Icon } = item;
                    const content = (
                      <>
                        <Icon
                          aria-hidden="true"
                          className="h-[19px] w-[19px] shrink-0 stroke-[1.7]"
                        />
                        <span>{label}</span>
                      </>
                    );

                    return 'href' in item ? (
                      <Link
                        key={label}
                        href={item.href}
                        role="menuitem"
                        onClick={closeMenu}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        onClick={closeMenu}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
                      >
                        {content}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
                  >
                    <LogOut
                      aria-hidden="true"
                      className="h-[19px] w-[19px] shrink-0 stroke-[1.7]"
                    />
                    <span>{isSigningOut ? 'در حال خروج…' : 'خروج'}</span>
                  </button>
                </div>

                <div className="mx-4 h-px bg-gray-100" />

                <div className="p-2">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    <Smartphone className="h-[19px] w-[19px] stroke-[1.7]" />
                    دانلود اپلیکیشن
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    <CircleHelp className="h-[19px] w-[19px] stroke-[1.7]" />
                    راهنما و پشتیبانی
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    <Globe2 className="h-[19px] w-[19px] stroke-[1.7]" />
                    فارسی (ایران)
                  </button>
                </div>

                <div className="mx-4 h-px bg-gray-100" />

                <Link
                  href="/auth/business"
                  role="menuitem"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-5 py-4 text-sm font-bold text-gray-950 transition-colors hover:bg-gray-50"
                >
                  <BriefcaseBusiness className="h-[19px] w-[19px] stroke-[1.7]" />
                  <span>فرشا برای متخصصان</span>
                  <ArrowLeft className="me-auto h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div
                id={menuId}
                role="menu"
                className="absolute left-0 top-[calc(100%+0.75rem)] w-[min(290px,calc(100vw-2rem))] rounded-2xl border border-gray-100 bg-white py-3 shadow-[0_18px_55px_rgba(0,0,0,0.14)]"
              >
                <div className="px-4 py-2">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    مشتریان
                  </h3>
                  <Link
                    href="/auth"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <LogIn className="h-5 w-5 text-gray-500" />
                    ورود یا ثبت‌نام
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Smartphone className="h-5 w-5 text-gray-500" />
                    دانلود اپلیکیشن Fresha
                  </button>
                </div>

                <div className="mx-4 my-1 h-px bg-gray-100" />

                <div className="px-4 py-2">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    کسب‌وکارها
                  </h3>
                  <Link
                    href="/auth/business"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <PlusCircle className="h-5 w-5 text-gray-500" />
                    ثبت کسب‌وکار جدید
                  </Link>
                  <Link
                    href="/auth/business"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <BriefcaseBusiness className="h-5 w-5 text-gray-500" />
                    نرم‌افزار مدیریت Fresha
                  </Link>
                </div>

                <div className="mx-4 my-1 h-px bg-gray-100" />

                <div className="px-4 py-2">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Globe2 className="h-5 w-5 text-gray-500" />
                    فارسی (ایران)
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </header>
  );
};
