'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import {
  completeBusinessSignUp,
  type BusinessSignUpState,
} from '@/actions/business.actions';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  type Country,
} from '@/components/features/auth/countries';

const INITIAL_STATE: BusinessSignUpState = { status: 'idle' };

interface BusinessSignUpFormProps {
  initialFirstName: string;
  initialLastName: string;
  initialPhone: string;
  initialCountryCode: string;
}

const inputClass =
  'h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-950 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10';

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1 text-sm leading-6 text-red-600">
      {children}
    </p>
  );
}

export const BusinessSignUpForm = ({
  initialFirstName,
  initialLastName,
  initialPhone,
  initialCountryCode,
}: BusinessSignUpFormProps) => {
  const [state, action, pending] = useActionState(
    completeBusinessSignUp,
    INITIAL_STATE
  );
  const initialCountry =
    COUNTRIES.find((item) => item.code === initialCountryCode) ??
    DEFAULT_COUNTRY;
  const [country, setCountry] = useState<Country>(initialCountry);
  const [showPassword, setShowPassword] = useState(false);

  const localPhone = initialPhone.startsWith(country.dialCode)
    ? initialPhone.slice(country.dialCode.length)
    : initialPhone;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="business-first-name"
          className="text-[15px] font-semibold text-neutral-950"
        >
          نام
        </label>
        <input
          id="business-first-name"
          name="firstName"
          type="text"
          autoComplete="given-name"
          maxLength={100}
          required
          defaultValue={initialFirstName}
          aria-describedby="business-first-name-error"
          className={inputClass}
        />
        <FieldError id="business-first-name-error">
          {state.fieldErrors?.firstName}
        </FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="business-last-name"
          className="text-[15px] font-semibold text-neutral-950"
        >
          نام خانوادگی
        </label>
        <input
          id="business-last-name"
          name="lastName"
          type="text"
          autoComplete="family-name"
          maxLength={100}
          defaultValue={initialLastName}
          aria-describedby="business-last-name-error"
          className={inputClass}
        />
        <FieldError id="business-last-name-error">
          {state.fieldErrors?.lastName}
        </FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="business-mobile"
          className="text-[15px] font-semibold text-neutral-950"
        >
          تلفن همراه
        </label>
        <div className="flex items-stretch overflow-hidden rounded-xl border border-neutral-300 bg-white transition focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10">
          <span className="flex items-center border-r border-neutral-200 bg-neutral-50 px-4 text-[15px] text-neutral-600">
            {country.dialCode}
          </span>
          <input
            id="business-mobile"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            dir="ltr"
            defaultValue={localPhone}
            aria-describedby="business-mobile-error"
            className="h-12 min-w-0 flex-1 bg-white px-4 text-left text-base text-neutral-950 outline-none"
          />
        </div>
        <FieldError id="business-mobile-error">
          {state.fieldErrors?.phone}
        </FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="business-password"
          className="text-[15px] font-semibold text-neutral-950"
        >
          رمز عبور
        </label>
        <div className="relative">
          <input
            id="business-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            dir="ltr"
            aria-describedby="business-password-error"
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Eye aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
        <FieldError id="business-password-error">
          {state.fieldErrors?.password}
        </FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="business-country"
          className="text-[15px] font-semibold text-neutral-950"
        >
          کشور
        </label>
        <select
          id="business-country"
          name="country"
          value={country.code}
          onChange={(event) => {
            const selected = COUNTRIES.find(
              (item) => item.code === event.target.value
            );
            if (selected) setCountry(selected);
          }}
          aria-describedby="business-country-error"
          className={`${inputClass} appearance-none`}
        >
          {COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.nameEn}
            </option>
          ))}
        </select>
        <FieldError id="business-country-error">
          {state.fieldErrors?.country}
        </FieldError>
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-neutral-600">
        <input
          type="checkbox"
          name="agreement"
          required
          className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-900"
        />
        <span>
          من با{' '}
          <a href="#" className="font-semibold text-neutral-950 underline">
            سیاست حفظ حریم خصوصی
          </a>
          ,{' '}
          <a href="#" className="font-semibold text-neutral-950 underline">
            شرایط استفاده از خدمات
          </a>{' '}
          and{' '}
          <a href="#" className="font-semibold text-neutral-950 underline">
            قوانین و شرایط کسب‌وکار
          </a>
          موافقم.
        </span>
      </label>
      <FieldError id="business-agreement-error">
        {state.fieldErrors?.agreement}
      </FieldError>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-neutral-950 px-5 text-[15px] font-bold text-white transition hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="mr-2 h-5 w-5 animate-spin"
            />
            ساخت حساب کاربری ...
          </>
        ) : (
          'موافقت و ایجاد حساب'
        )}
      </button>

      {state.status === 'error' && state.message && !state.fieldErrors && (
        <p role="alert" className="text-center text-sm leading-6 text-red-600">
          {state.message}
        </p>
      )}

      <p className="text-center text-xs leading-5 text-neutral-500">
       با ارائه شماره موبایل خود، رضایت می‌دهید که پیامک‌های مربوط به وضعیت ثبت‌نام را از Fresha دریافت کنید. شما می‌توانید در هر زمان با ارسال پاسخ «STOP» از دریافت این پیام‌ها انصراف دهید. تعداد پیام‌های ارسالی متغیر است و ممکن است هزینه‌های معمول پیامک و اینترنت (دیتا) بر اساس تعرفه اپراتور شما اعمال شود.
      </p>
    </form>
  );
};