'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { LoaderCircle, Smartphone } from 'lucide-react';

type Feedback = {
  tone: 'error' | 'info';
  message: string;
} | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BusinessAuthForm = () => {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setFeedback({
        tone: 'error',
        message: 'لطفاً یک نشانی ایمیل معتبر وارد کنید.',
      });
      return;
    }

    setFeedback({
      tone: 'info',
      message: 'ایمیل شما آماده است؛ ارسال کد تأیید پس از اتصال سرویس ورود فعال می‌شود.',
    });
  };

  const showUnavailableMessage = (method: string) => {
    setFeedback({
      tone: 'info',
      message: `${method} به‌زودی فعال می‌شود.`,
    });
  };

  const handleGoogleSignIn = async () => {
    setGoogleError(null);
    setIsGooglePending(true);

    try {
      await signIn('google', { redirectTo: '/auth/business/complete' });
    } catch {
      setGoogleError(
        'اتصال به گوگل انجام نشد. لطفاً اتصال اینترنت و تنظیمات حساب را بررسی کنید.'
      );
      setIsGooglePending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="business-email"
          className="text-[15px] font-semibold text-neutral-950"
        >
          ایمیل
        </label>
        <input
          id="business-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          dir="ltr"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (feedback?.tone === 'error') {
              setFeedback(null);
            }
          }}
          aria-describedby="business-email-help business-auth-feedback"
          className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-left text-base text-neutral-950 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
        />
        <p id="business-email-help" className="text-[13px] leading-6 text-neutral-500">
          یک کد تأیید برایتان ارسال می‌کنیم.
        </p>
      </div>

      <button
        type="submit"
        className="h-12 w-full rounded-full bg-neutral-950 px-5 text-[15px] font-bold text-white transition hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      >
        ادامه
      </button>

      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-sm text-neutral-500">یا</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <button
        type="button"
        onClick={() => showUnavailableMessage('ورود با شماره موبایل')}
        className="relative flex h-12 w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-14 text-[15px] font-semibold text-neutral-950 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      >
        <Smartphone aria-hidden="true" className="absolute right-5 h-5 w-5" strokeWidth={1.8} />
        ادامه با شماره موبایل
      </button>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGooglePending}
        aria-busy={isGooglePending}
        className="relative flex h-12 w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-14 text-[15px] font-semibold text-neutral-950 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
      >
        {isGooglePending ? (
          <LoaderCircle aria-hidden="true" className="absolute right-5 h-5 w-5 animate-spin text-neutral-700" />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="absolute right-5 h-5 w-5">
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.29A7.16 7.16 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
            />
          </svg>
        )}
        {isGooglePending ? 'در حال اتصال به گوگل…' : 'ادامه با گوگل'}
      </button>

      {googleError && (
        <p role="alert" className="text-center text-sm leading-6 text-red-600">
          {googleError}
        </p>
      )}

      <button
        type="button"
        onClick={() => showUnavailableMessage('ورود با اپل')}
        className="relative flex h-12 w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-14 text-[15px] font-semibold text-neutral-950 transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="absolute right-5 h-5 w-5 fill-neutral-950"
        >
          <path d="M17.05 12.54c-.03-1.73 1.42-2.56 1.49-2.6-.81-1.18-2.07-1.35-2.52-1.37-1.07-.11-2.1.63-2.64.63-.55 0-1.4-.61-2.3-.6-1.18.02-2.27.69-2.88 1.75-1.23 2.13-.32 5.28.88 7.01.58.85 1.28 1.8 2.19 1.77.88-.04 1.21-.57 2.28-.57 1.07 0 1.37.57 2.31.55.95-.02 1.56-.87 2.14-1.72.67-.98.95-1.93.96-1.98-.02-.01-1.83-.7-1.85-2.77ZM14.5 5.34c.49-.59.82-1.4.73-2.21-.7.03-1.56.47-2.07 1.06-.45.52-.85 1.35-.75 2.14.78.06 1.58-.4 2.09-.99Z" />
        </svg>
        ادامه با اپل
      </button>

      <div
        id="business-auth-feedback"
        aria-live="polite"
        className={`min-h-6 text-center text-sm leading-6 ${
          feedback?.tone === 'error' ? 'text-red-600' : 'text-neutral-500'
        }`}
      >
        {feedback?.message}
      </div>

      <div className="border-t border-neutral-200 pt-5 text-center">
        <p className="text-sm font-semibold text-neutral-950">
          برای رزرو نوبت به‌عنوان مشتری وارد می‌شوید؟
        </p>
        <Link
          href="/auth/customer"
          className="mt-1 inline-flex text-sm font-semibold text-violet-600 transition hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        >
          رفتن به فرشا برای مشتریان
        </Link>
      </div>
    </form>
  );
};