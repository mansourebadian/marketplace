'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Heart,
  Home,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Settings,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import {
  saveCustomerAddress,
  updateCustomerProfile,
  type AddressActionState,
  type ProfileActionState,
} from '@/actions/profile.actions';

export type AddressLabel = 'HOME' | 'WORK';

export interface CustomerAddressView {
  id: string;
  label: AddressLabel;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface CustomerProfileView {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  image: string;
  dateOfBirth: string;
  gender: string;
}

interface ProfilePageClientProps {
  profile: CustomerProfileView;
  addresses: CustomerAddressView[];
}

const PROFILE_INITIAL_STATE: ProfileActionState = { status: 'idle' };
const ADDRESS_INITIAL_STATE: AddressActionState = { status: 'idle' };

const NAV_ITEMS = [
  { label: 'پروفایل', icon: UserRound, href: '/profile' },
  { label: 'فعالیت‌ها', icon: CalendarDays, href: '/activities' },
  { label: 'کیف پول', icon: WalletCards },
  { label: 'پیام‌ها', icon: MessageCircle },
  { label: 'علاقه‌مندی‌ها', icon: Heart },
  { label: 'فرم‌ها', icon: ClipboardList },
  { label: 'تنظیمات', icon: Settings },
] as const;

const GENDER_LABELS: Record<string, string> = {
  FEMALE: 'زن',
  MALE: 'مرد',
  OTHER: 'سایر',
  PREFER_NOT_TO_SAY: 'ترجیح می‌دهم نگویم',
};

const fieldClass =
  'mt-2 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-950 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100';

function formatBirthDate(value: string) {
  if (!value) return 'ثبت نشده';

  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(
    new Date(`${value}T12:00:00.000Z`)
  );
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600">
      {children}
    </p>
  );
}

function ProfileEditor({
  profile,
  onCancel,
  onSaved,
}: {
  profile: CustomerProfileView;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(
    updateCustomerProfile,
    PROFILE_INITIAL_STATE
  );

  useEffect(() => {
    if (state.status === 'success') {
      onSaved(state.message || 'اطلاعات ذخیره شد.');
    }
  }, [state, onSaved]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-800">
          نام
          <input
            name="firstName"
            defaultValue={profile.firstName}
            autoComplete="given-name"
            maxLength={100}
            required
            aria-describedby="firstName-error"
            className={fieldClass}
          />
          <FieldError id="firstName-error">{state.fieldErrors?.firstName}</FieldError>
        </label>
        <label className="text-sm font-semibold text-gray-800">
          نام خانوادگی
          <input
            name="lastName"
            defaultValue={profile.lastName}
            autoComplete="family-name"
            maxLength={100}
            aria-describedby="lastName-error"
            className={fieldClass}
          />
          <FieldError id="lastName-error">{state.fieldErrors?.lastName}</FieldError>
        </label>
      </div>

      <label className="block text-sm font-semibold text-gray-800">
        شماره تلفن
        <input
          name="phone"
          type="tel"
          dir="ltr"
          defaultValue={profile.phone}
          autoComplete="tel"
          maxLength={32}
          placeholder="09123456789"
          aria-describedby="phone-error"
          className={`${fieldClass} text-left`}
        />
        <FieldError id="phone-error">{state.fieldErrors?.phone}</FieldError>
      </label>

      <label className="block text-sm font-semibold text-gray-800">
        ایمیل
        <input
          name="email"
          type="email"
          dir="ltr"
          defaultValue={profile.email}
          autoComplete="email"
          maxLength={320}
          required
          aria-describedby="email-error email-help"
          className={`${fieldClass} text-left`}
        />
        <FieldError id="email-error">{state.fieldErrors?.email}</FieldError>
        <span id="email-help" className="mt-1 block text-xs font-normal text-gray-500">
          با تغییر ایمیل، وضعیت تأیید ایمیل جدید بازنشانی می‌شود.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-800">
          تاریخ تولد
          <input
            name="dateOfBirth"
            type="date"
            dir="ltr"
            defaultValue={profile.dateOfBirth}
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            aria-describedby="dateOfBirth-error"
            className={`${fieldClass} text-left`}
          />
          <FieldError id="dateOfBirth-error">
            {state.fieldErrors?.dateOfBirth}
          </FieldError>
        </label>
        <label className="text-sm font-semibold text-gray-800">
          جنسیت
          <select
            name="gender"
            defaultValue={profile.gender}
            aria-describedby="gender-error"
            className={fieldClass}
          >
            <option value="">انتخاب نشده</option>
            <option value="FEMALE">زن</option>
            <option value="MALE">مرد</option>
            <option value="OTHER">سایر</option>
            <option value="PREFER_NOT_TO_SAY">ترجیح می‌دهم نگویم</option>
          </select>
          <FieldError id="gender-error">{state.fieldErrors?.gender}</FieldError>
        </label>
      </div>

      {state.status === 'error' && state.message && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
        >
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          ذخیره تغییرات
        </button>
      </div>
    </form>
  );
}

function AddressEditor({
  label,
  address,
  onCancel,
  onSaved,
}: {
  label: AddressLabel;
  address?: CustomerAddressView;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const [state, action, pending] = useActionState(
    saveCustomerAddress,
    ADDRESS_INITIAL_STATE
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (state.status === 'success') {
      onSaved(state.message || 'آدرس ذخیره شد.');
    }
  }, [state, onSaved]);

  return (
    <form action={action} className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
      <input type="hidden" name="label" value={label} />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-gray-950">
            {address ? 'ویرایش' : 'افزودن'} آدرس {label === 'HOME' ? 'خانه' : 'محل کار'}
          </p>
          <p className="mt-1 text-xs text-gray-500">اطلاعات روی سرور و برای حساب فعلی ذخیره می‌شود.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          aria-label="بستن فرم آدرس"
          className="rounded-full p-2 text-gray-500 hover:bg-white hover:text-gray-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <label className="block text-sm font-semibold text-gray-800">
        نشانی کامل
        <textarea
          name="addressLine"
          defaultValue={address?.addressLine}
          autoComplete="street-address"
          maxLength={300}
          rows={3}
          required
          aria-describedby="addressLine-error"
          className={`${fieldClass} resize-none`}
        />
        <FieldError id="addressLine-error">{state.fieldErrors?.addressLine}</FieldError>
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-800">
          شهر
          <input name="city" defaultValue={address?.city} autoComplete="address-level2" maxLength={100} className={fieldClass} />
          <FieldError id="city-error">{state.fieldErrors?.city}</FieldError>
        </label>
        <label className="text-sm font-semibold text-gray-800">
          استان
          <input name="province" defaultValue={address?.province} autoComplete="address-level1" maxLength={100} className={fieldClass} />
          <FieldError id="province-error">{state.fieldErrors?.province}</FieldError>
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-gray-800">
        کد پستی
        <input name="postalCode" dir="ltr" defaultValue={address?.postalCode} autoComplete="postal-code" maxLength={20} className={`${fieldClass} text-left`} />
        <FieldError id="postalCode-error">{state.fieldErrors?.postalCode}</FieldError>
      </label>

      {state.status === 'error' && state.message && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          {address && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={pending} className="text-sm font-bold text-red-600 hover:text-red-700">
              حذف آدرس
            </button>
          )}
          {address && confirmDelete && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">حذف شود؟</span>
              <button type="submit" name="intent" value="delete" formNoValidate disabled={pending} className="font-bold text-red-600">بله</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="font-bold text-gray-600">خیر</button>
            </div>
          )}
        </div>
        <button type="submit" name="intent" value="save" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70">
          {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          ذخیره آدرس
        </button>
      </div>
    </form>
  );
}

export function ProfilePageClient({ profile, addresses }: ProfilePageClientProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressLabel | null>(null);
  const [notice, setNotice] = useState('');
  const pathname = usePathname();
  const avatarLetter = profile.displayName.trim().charAt(0) || 'ف';
  const addressByLabel = Object.fromEntries(addresses.map((item) => [item.label, item])) as Partial<Record<AddressLabel, CustomerAddressView>>;

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const finishEdit = (message: string) => {
    setEditingProfile(false);
    setEditingAddress(null);
    setNotice(message);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] pt-16 md:min-h-[calc(100vh-5rem)] md:pt-20">
      <aside className="hidden w-64 shrink-0 border-l border-gray-200 bg-white lg:block">
        <div className="sticky top-20 p-5">
          <p className="mb-4 truncate px-3 text-lg font-black text-gray-950" dir="auto">{profile.displayName}</p>
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
              <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">پروفایل</h1>
              <p className="mt-2 text-sm text-gray-500">مشخصات حساب و آدرس‌های خود را مشاهده و اصلاح کنید.</p>
            </div>
            <Link href="/" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 lg:hidden">خانه</Link>
          </div>

          {notice && (
            <div role="status" aria-live="polite" className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />{notice}
            </div>
          )}

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <button type="button" onClick={() => setEditingProfile((value) => !value)} className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800">
                  <Pencil className="h-4 w-4" />{editingProfile ? 'بستن' : 'ویرایش'}
                </button>
                <div className="text-center">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-3xl font-black text-gray-500">
                    {profile.image ? <Image src={profile.image} alt={`تصویر ${profile.displayName}`} width={112} height={112} className="h-full w-full object-cover" /> : avatarLetter}
                  </div>
                  <h2 className="mt-4 text-xl font-black text-gray-950" dir="auto">{profile.displayName}</h2>
                </div>
                <span className="w-14" aria-hidden="true" />
              </div>

              <div className="border-t border-gray-200 pt-5">
                {editingProfile ? (
                  <ProfileEditor profile={profile} onCancel={() => setEditingProfile(false)} onSaved={finishEdit} />
                ) : (
                  <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-1">
                    {[
                      ['نام', profile.firstName || 'ثبت نشده'],
                      ['نام خانوادگی', profile.lastName || 'ثبت نشده'],
                      ['شماره تلفن', profile.phone || 'ثبت نشده'],
                      ['ایمیل', profile.email],
                      ['تاریخ تولد', formatBirthDate(profile.dateOfBirth)],
                      ['جنسیت', GENDER_LABELS[profile.gender] || 'ثبت نشده'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-sm font-bold text-gray-950">{label}</dt>
                        <dd className="mt-1 break-words text-sm text-gray-500" dir={label === 'ایمیل' || label === 'شماره تلفن' ? 'ltr' : 'auto'}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-gray-950">آدرس‌های من</h2>
              <div className="mt-5 space-y-3">
                {(['HOME', 'WORK'] as const).map((label) => {
                  const address = addressByLabel[label];
                  const Icon = label === 'HOME' ? Home : BriefcaseBusiness;
                  const title = label === 'HOME' ? 'خانه' : 'محل کار';
                  const meta = address ? [address.city, address.province, address.postalCode].filter(Boolean).join('، ') : '';
                  return (
                    <button key={label} type="button" onClick={() => setEditingAddress(label)} className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 px-4 py-4 text-right transition hover:border-indigo-300 hover:bg-indigo-50/30">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-gray-950">{title}</span>
                        <span className="mt-1 block truncate text-sm text-gray-500">{address?.addressLine || `افزودن آدرس ${title}`}</span>
                        {meta && <span className="mt-1 block truncate text-xs text-gray-400">{meta}</span>}
                      </span>
                      {address ? <Pencil className="h-4 w-4 shrink-0 text-gray-400" /> : <Plus className="h-5 w-5 shrink-0 text-gray-500" />}
                    </button>
                  );
                })}
              </div>

              {editingAddress && (
                <AddressEditor
                  key={editingAddress}
                  label={editingAddress}
                  address={addressByLabel[editingAddress]}
                  onCancel={() => setEditingAddress(null)}
                  onSaved={finishEdit}
                />
              )}

              {!editingAddress && (
                <button type="button" onClick={() => setEditingAddress(addressByLabel.HOME ? 'WORK' : 'HOME')} className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50">
                  <Plus className="h-4 w-4" />افزودن آدرس
                </button>
              )}

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-3 text-xs leading-6 text-gray-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />این آدرس‌ها برای رزروها و پیشنهادهای نزدیک شما استفاده می‌شوند.
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
