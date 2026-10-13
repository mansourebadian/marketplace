'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { saveServiceLocation, type OnboardingServiceLocationState } from '@/actions/onboarding.actions';

const OPTIONS = [
  { value: 'PHYSICAL_LOCATION', label: 'مشتریان به محل کار من می‌آیند' },
  { value: 'MOBILE_OPERATOR', label: 'من به‌عنوان اپراتور سیار به مشتریان مراجعه می‌کنم' },
  { value: 'VIRTUAL_ONLINE', label: 'خدمات مجازی را به‌صورت آنلاین ارائه می‌دهم' },
] as const;

export function ServiceLocationForm({ initialLocation }: { initialLocation: string }) {
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(initialLocation);
      return Array.isArray(parsed) ? parsed : initialLocation ? [initialLocation] : [];
    } catch {
      return initialLocation ? [initialLocation] : [];
    }
  });
  const [state, action, pending] = useActionState<OnboardingServiceLocationState, FormData>(saveServiceLocation, { status: 'idle' });
  return <div dir="rtl" className="mx-auto w-full max-w-[1408px] px-5 pb-8 pt-7 sm:px-8">
    <div className="mb-4 flex items-center justify-between">
      <Link href="/onboarding/team" aria-label="بازگشت" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50"><ArrowRight className="h-5 w-5" /></Link>
      <button form="service-location-form" type="submit" disabled={pending || !selected.length} className="inline-flex h-12 items-center gap-3 rounded-full bg-neutral-950 px-6 font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? 'در حال ذخیره…' : 'ادامه'}<ArrowLeft className="h-5 w-5" /></button>
    </div>
    <div className="mx-auto max-w-[696px]"><p className="mb-3 text-sm text-neutral-500">راه‌اندازی حساب</p><h1 className="mb-8 text-3xl font-bold leading-relaxed text-neutral-950 sm:text-4xl">خدمات خود را کجا ارائه می‌دهید؟</h1>
      <form id="service-location-form" action={action}><fieldset disabled={pending} className="space-y-4"><legend className="sr-only">یک یا چند محل ارائه خدمات را انتخاب کنید</legend>{OPTIONS.map((option) => { const isSelected = selected.includes(option.value); return <label key={option.value} className="relative block cursor-pointer"><input className="peer sr-only" type="checkbox" name="serviceLocation" value={option.value} checked={isSelected} onChange={() => setSelected((current) => isSelected ? current.filter((value) => value !== option.value) : [...current, option.value])} /><span className="flex min-h-[68px] items-center justify-between rounded-xl border border-neutral-200 px-6 py-4 text-sm font-semibold text-neutral-950 transition-colors hover:border-neutral-400 peer-checked:border-violet-600 peer-checked:bg-violet-50 peer-checked:ring-1 peer-checked:ring-violet-600 peer-focus-visible:outline-2 peer-focus-visible:outline-violet-600">{option.label}{isSelected && <Check aria-hidden="true" className="h-5 w-5 text-violet-600" />}</span></label>; })}</fieldset>{state.message && <p role={state.status === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${state.status === 'error' ? 'text-red-600' : 'text-green-700'}`}>{state.message}</p>}</form>
    </div>
  </div>;
}
