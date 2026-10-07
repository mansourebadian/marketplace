'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Scissors, Hand, Eye, SprayCan, Sparkles, Armchair, Bed, Bath, Paintbrush, Heart, Glasses, Bike, Footprints, Cross, Dog, Grid2X2 } from 'lucide-react';
import { BUSINESS_CATEGORIES } from '@/lib/business-categories';
import { saveBusinessCategories, type OnboardingCategoriesState } from '@/actions/onboarding.actions';

const icons = { Scissors, Hand, Eye, SprayCan, Sparkles, Armchair, Bed, Bath, Paintbrush, Heart, Glasses, Bike, Footprints, Cross, Dog, Grid2X2 };
const initialState: OnboardingCategoriesState = { status: 'idle' };

export function BusinessCategoryForm({ initialCategories, initialOtherServiceName = '' }: {
  initialCategories: string[];
  initialOtherServiceName?: string;
}) {
  const [selected, setSelected] = useState(initialCategories);
  const [otherServiceName, setOtherServiceName] = useState(initialOtherServiceName);
  const [state, action, pending] = useActionState(saveBusinessCategories, initialState);
  const [changed, setChanged] = useState(false);

  function toggle(slug: string) {
    setSelected((current) => current.includes(slug) ? current.filter((item) => item !== slug) : current.length < 4 ? [...current, slug] : current);
    setChanged(true);
  }

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[1408px] px-5 pb-8 pt-7 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/onboarding/business-name" aria-label="بازگشت به نام کسب‌وکار" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-50">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <button form="business-category-form" type="submit" disabled={pending || selected.length === 0} className="inline-flex h-12 items-center gap-3 rounded-full bg-neutral-950 px-6 font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? 'در حال ذخیره…' : 'ادامه'}<ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="mx-auto max-w-[960px]">
        <p className="mb-3 text-sm text-neutral-500">راه‌اندازی حساب</p>
        <h1 className="mb-3 text-2xl font-bold leading-relaxed text-neutral-950 sm:text-4xl">دسته‌بندی‌هایی را انتخاب کنید که کسب‌وکار شما را بهتر توصیف می‌کنند</h1>
        <p className="mb-7 text-neutral-500">دسته اصلی و حداکثر ۳ نوع خدمت مرتبط را انتخاب کنید. اولین انتخاب شما دسته اصلی است.</p>
        <form id="business-category-form" action={action} onSubmit={() => setChanged(false)}>
          {selected.map((slug) => <input key={slug} type="hidden" name="categories" value={slug} />)}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BUSINESS_CATEGORIES.map((category) => {
              const Icon = icons[category.icon];
              const index = selected.indexOf(category.slug);
              const active = index !== -1;
              return (
                <button key={category.slug} type="button" aria-pressed={active} disabled={pending || (!active && selected.length === 4)} onClick={() => toggle(category.slug)} className={`relative flex min-h-[104px] flex-col items-start justify-center gap-3 rounded-xl border px-6 py-4 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed ${active ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-600' : 'border-neutral-200 bg-white hover:border-neutral-400 disabled:opacity-40'}`}>
                  <Icon className="h-7 w-7 text-neutral-950" strokeWidth={1.6} />
                  <span className="text-sm font-semibold text-neutral-950">{category.label}</span>
                  {active && <span className="absolute left-3 top-3 flex items-center gap-1 text-xs font-medium text-violet-700"><Check className="h-4 w-4" />{index === 0 ? 'اصلی' : 'مرتبط'}</span>}
                </button>
              );
            })}
          </div>
          {selected.includes('other') && (
            <div className="mt-6">
              <label htmlFor="otherServiceName" className="mb-2 block text-sm font-semibold text-neutral-950">نام سرویس دیگر</label>
              <input
                id="otherServiceName"
                name="otherServiceName"
                type="text"
                value={otherServiceName}
                onChange={(event) => { setOtherServiceName(event.target.value); setChanged(true); }}
                autoFocus
                required
                maxLength={100}
                readOnly={pending}
                aria-invalid={!!state.otherServiceError && !changed}
                aria-describedby={state.otherServiceError && !changed ? 'other-service-error' : undefined}
                className="h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-sm text-neutral-950 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
              />
              {state.otherServiceError && !changed && <p id="other-service-error" role="alert" className="mt-2 text-sm text-red-600">{state.otherServiceError}</p>}
            </div>
          )}
          <p className="mt-4 text-sm text-neutral-500" aria-live="polite">{selected.length.toLocaleString('fa-IR')} از ۴ دسته انتخاب شده است.</p>
          {state.message && (!changed || state.status === 'error') && <p role={state.status === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm ${state.status === 'error' ? 'text-red-600' : 'text-green-700'}`}>{state.message}</p>}
        </form>
      </div>
    </div>
  );
}
