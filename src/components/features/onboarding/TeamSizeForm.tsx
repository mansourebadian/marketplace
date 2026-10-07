'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Lightbulb } from 'lucide-react';
import { TEAM_SIZES } from '@/lib/team-sizes';
import { saveTeamSize, type OnboardingTeamState } from '@/actions/onboarding.actions';

const initialState: OnboardingTeamState = { status: 'idle' };

export function TeamSizeForm({ initialTeamSize }: { initialTeamSize: string }) {
  const [selected, setSelected] = useState(initialTeamSize);
  const [state, action, pending] = useActionState(saveTeamSize, initialState);
  const [changed, setChanged] = useState(false);

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[1408px] px-5 pb-8 pt-7 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/onboarding/business-category" aria-label="بازگشت به انتخاب دسته‌بندی" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <button form="team-size-form" type="submit" disabled={pending || !selected} className="inline-flex h-12 items-center gap-3 rounded-full bg-neutral-950 px-6 font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'در حال ذخیره…' : 'ادامه'}<ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto max-w-[696px]">
        <p className="mb-3 text-sm text-neutral-500">راه‌اندازی حساب</p>
        <h1 className="mb-3 text-3xl font-bold leading-relaxed text-neutral-950 sm:text-4xl">اندازه تیم شما چقدر است؟</h1>
        <p className="mb-8 text-neutral-500">این اطلاعات به ما کمک می‌کند تقویم کاری شما را به‌درستی تنظیم کنیم.</p>
        <form id="team-size-form" action={action} onSubmit={() => setChanged(false)}>
          <fieldset disabled={pending} className="space-y-4">
            <legend className="sr-only">اندازه تیم خود را انتخاب کنید</legend>
            {TEAM_SIZES.map((size) => (
              <label key={size.value} className="relative block cursor-pointer">
                <input type="radio" name="teamSize" value={size.value} checked={selected === size.value} onChange={() => { setSelected(size.value); setChanged(true); }} required className="peer sr-only" />
                <span className="flex min-h-[60px] items-center justify-between rounded-xl border border-neutral-200 px-6 py-4 text-sm font-semibold text-neutral-950 transition-colors hover:border-neutral-400 peer-checked:border-violet-600 peer-checked:bg-violet-50 peer-checked:ring-1 peer-checked:ring-violet-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet-600 peer-disabled:cursor-wait">
                  {size.label}
                  {selected === size.value && <Check aria-hidden="true" className="h-5 w-5 text-violet-600" />}
                </span>
              </label>
            ))}
          </fieldset>
          <div aria-live="polite">
            {selected && selected !== 'INDEPENDENT' && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-4">
                <Lightbulb aria-hidden="true" className="h-5 w-5 shrink-0 text-violet-600" strokeWidth={1.6} />
                <p className="text-sm leading-relaxed text-neutral-950">
                  برای آشنایی شما با نحوه کار سیستم، «وندی» را به‌عنوان یک کارمند نمونه اضافه می‌کنیم. پس از ورود به حساب، می‌توانید اعضای تیم خود را مدیریت کنید.
                </p>
              </div>
            )}
          </div>
          {state.message && !changed && <p role={state.status === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${state.status === 'error' ? 'text-red-600' : 'text-green-700'}`}>{state.message}</p>}
        </form>
      </div>
    </div>
  );
}
