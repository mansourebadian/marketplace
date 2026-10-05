// src/components/features/onboarding/BusinessNameForm.tsx
'use client';

import { useActionState, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { saveBusinessName, type OnboardingBusinessNameState } from '@/actions/onboarding.actions';

const initialState: OnboardingBusinessNameState = { status: 'idle' };

export function BusinessNameForm({ initialName = '', initialWebsite = '' }: {
  initialName?: string;
  initialWebsite?: string;
}) {
  const [businessName, setBusinessName] = useState(initialName);
  const [website, setWebsite] = useState(initialWebsite);
  const [state, formAction, isPending] = useActionState(saveBusinessName, initialState);
  const hasNameError = !!state.fieldErrors?.businessName;

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* دکمه ادامه — fixed گوشه بالا-چپ (معادل RTL گوشه راست تصویر) */}
      <button
        form="onboarding-form"
        type="submit"
        disabled={isPending}
        className="fixed top-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-neutral-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'در حال ذخیره...' : 'ادامه'}
        <ArrowLeft className="h-4 w-4 shrink-0" />
      </button>

      {/* محتوای صفحه */}
      <div className="px-10 pt-20 max-w-2xl">
        <p className="text-sm text-gray-500 mb-3">راه‌اندازی حساب</p>

        <h1 className="text-[2rem] font-bold leading-snug text-gray-900 mb-2">
          نام کسب‌وکار شما چیست؟
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          این نامی است که مشتریان شما می‌بینند. نام حقوقی و صورت‌حساب را می‌توانید بعداً اضافه کنید.
        </p>

        <form id="onboarding-form" action={formAction} className="space-y-6">
          {/* نام کسب‌وکار */}
          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-semibold text-gray-800 mb-1.5"
            >
              نام کسب‌وکار
            </label>
            <input
              id="businessName"
              name="businessName"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              type="text"
              autoFocus
              className={`w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
                hasNameError
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
              }`}
            />
            {hasNameError && (
              <p className="mt-1.5 text-sm text-red-500">
                {state.fieldErrors?.businessName}
              </p>
            )}
          </div>

          {/* وب‌سایت */}
          <div>
            <label
              htmlFor="website"
              className="block text-sm font-semibold text-gray-800 mb-1.5"
            >
              وب‌سایت{' '}
              <span className="font-normal text-gray-400">(اختیاری)</span>
            </label>
            <input
              id="website"
              name="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              type="text"
              placeholder="www.yoursite.com"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400 placeholder:text-gray-300 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {state.fieldErrors?.website && (
              <p className="mt-1.5 text-sm text-red-500">{state.fieldErrors.website}</p>
            )}
          </div>

          {state.message && (
            <p role={state.status === 'error' ? 'alert' : 'status'}
              className={`text-sm ${state.status === 'success' ? 'text-green-700' : 'text-red-500'}`}>
              {state.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
