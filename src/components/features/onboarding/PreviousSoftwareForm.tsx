'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { savePreviousSoftware, type PreviousSoftwareState } from '@/actions/onboarding.actions';

const OPTIONS = [
  ['ACUITY', 'Acuity'], ['BOOKSY', 'Booksy'], ['CALENDLY', 'Calendly'], ['GOLDIE', 'Goldie'],
  ['JANEAPP', 'Janeapp'], ['MINDBODY', 'Mindbody'], ['SALON_IRIS', 'Salon Iris'], ['SETMORE', 'Setmore'],
  ['SHORTCUTS', 'Shortcuts'], ['SQUARE', 'Square'], ['STYLESEAT', 'Styleseat'], ['TIMELY', 'Timely'],
  ['TREATWELL', 'Treatwell'], ['VAGARO', 'Vagaro'], ['ZENOTI', 'Zenoti'],
  ['NONE', 'از هیچ نرم‌افزاری استفاده نمی‌کنم'], ['OTHER', 'سایر نرم‌افزارها'],
] as const;

export function PreviousSoftwareForm({ initialSoftware }: { initialSoftware: string }) {
  const [selected, setSelected] = useState(initialSoftware);
  const [state, action, pending] = useActionState<PreviousSoftwareState, FormData>(savePreviousSoftware, { status: 'idle' });

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[1408px] px-5 pb-8 pt-7 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/onboarding/business-location" aria-label="بازگشت به انتخاب محل ارائه خدمات" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <button form="previous-software-form" type="submit" disabled={pending || !selected} className="inline-flex h-12 items-center gap-3 rounded-full bg-neutral-950 px-6 font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'در حال ذخیره…' : 'ادامه'}<ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto max-w-[696px]">
        <p className="mb-3 text-sm text-neutral-500">راه‌اندازی حساب</p>
        <h1 className="mb-3 text-3xl font-bold leading-relaxed text-neutral-950 sm:text-4xl">در حال حاضر از چه نرم‌افزاری استفاده می‌کنید؟</h1>
        <p className="mb-8 text-neutral-500">اگر قصد تغییر نرم‌افزار خود را دارید، می‌توانیم به راه‌اندازی سریع‌تر کسب‌وکار و انتقال اطلاعات شما به حساب جدیدتان کمک کنیم.</p>
        <form id="previous-software-form" action={action}>
          <fieldset disabled={pending} className="space-y-4">
            <legend className="sr-only">نرم‌افزار فعلی خود را انتخاب کنید</legend>
            {OPTIONS.map(([value, label]) => (
              <label key={value} className="relative block cursor-pointer">
                <input type="radio" name="previousSoftware" value={value} checked={selected === value} onChange={() => setSelected(value)} required className="peer sr-only" />
                <span className="flex min-h-[68px] items-center justify-between rounded-xl border border-neutral-200 px-6 py-4 text-sm font-semibold text-neutral-950 transition-colors hover:border-neutral-400 peer-checked:border-violet-600 peer-checked:bg-violet-50 peer-checked:ring-1 peer-checked:ring-violet-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet-600 peer-disabled:cursor-wait">
                  <span dir="auto">{label}</span>
                  {selected === value && <Check aria-hidden="true" className="h-5 w-5 text-violet-600" />}
                </span>
              </label>
            ))}
          </fieldset>
          {state.message && <p role="alert" className="mt-4 text-sm text-red-600">{state.message}</p>}
        </form>
      </div>
    </div>
  );
}
