'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { confirmPhoneOtp, resendPhoneOtp } from '@/actions/phone-auth.actions';
import { latinDigits } from '@/lib/phone';

export function PhoneOtpForm({ phone, resendAt, backHref }: { phone: string; resendAt: number; backHref: string }) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [state, action, pending] = useActionState(confirmPhoneOtp, {});
  const [resending, startResending] = useTransition();
  const [resendError, setResendError] = useState('');
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  function enter(value: string, index: number) {
    const numbers = latinDigits(value).replace(/\D/g, '').slice(0, 6);
    const start = numbers.length === 6 ? 0 : index;
    setDigits(current => {
      const next = [...current];
      if (!numbers) next[index] = '';
      else numbers.split('').forEach((digit, offset) => { if (start + offset < 6) next[start + offset] = digit; });
      return next;
    });
    if (numbers) inputs.current[Math.min(start + numbers.length, 5)]?.focus();
  }

  return <div dir="rtl" className="w-full">
    <header className="mb-6 text-center">
      <h1 className="text-2xl font-bold text-neutral-950">شماره موبایل خود را تأیید کنید</h1>
      <p className="mt-2 text-sm leading-7 text-neutral-500">کد تأیید به شمارهٔ <bdi dir="ltr" className="whitespace-nowrap">{phone}</bdi> ارسال شد.</p>
    </header>
    <form action={action} className="space-y-6">
      <input type="hidden" name="code" value={digits.join('')} />
      <fieldset disabled={pending || resending}>
        <legend className="sr-only">کد تأیید شش‌رقمی</legend>
        <div dir="ltr" className="mx-auto flex max-w-[348px] justify-center gap-2 sm:gap-3">
          {digits.map((digit, index) => <input
            key={index}
            ref={element => { inputs.current[index] = element; }}
            type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`رقم ${index + 1} کد تأیید`} aria-describedby="otp-error"
            value={digit} maxLength={6} autoFocus={index === 0}
            onFocus={event => event.target.select()}
            onChange={event => enter(event.target.value, index)}
            onPaste={event => { event.preventDefault(); enter(event.clipboardData.getData('text'), index); }}
            onKeyDown={event => {
              if (event.key === 'Backspace' && !digit && index > 0) inputs.current[index - 1]?.focus();
              if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); inputs.current[index - 1]?.focus(); }
              if (event.key === 'ArrowRight' && index < 5) { event.preventDefault(); inputs.current[index + 1]?.focus(); }
            }}
            className="h-[60px] w-full min-w-0 max-w-12 rounded-lg border border-neutral-300 text-center text-2xl font-semibold text-neutral-950 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100 disabled:bg-neutral-50"
          />)}
        </div>
      </fieldset>
      <button type="submit" disabled={pending || resending || digits.some(digit => !digit)} className="h-12 w-full rounded-full bg-neutral-950 px-5 text-base font-bold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400">
        {pending ? 'در حال تأیید…' : 'ادامه'}
      </button>
      <p id="otp-error" role="alert" className="text-center text-sm leading-6 text-red-600">{state.error || resendError}</p>
    </form>
    <div className="mt-3 space-y-3 text-center text-sm leading-7">
      <p className="text-neutral-500">کد را دریافت نکردید؟{' '}
        <button type="button" disabled={remaining > 0 || pending || resending} onClick={() => startResending(async () => {
          setResendError('');
          try {
            const result = await resendPhoneOtp();
            if (result.error) setResendError(result.error);
            if (result.sent) window.location.assign('/auth/phone');
          } catch { setResendError('ارسال مجدد انجام نشد. دوباره تلاش کنید.'); }
        })} className="font-medium text-violet-600 disabled:text-neutral-400">
          {resending ? 'در حال ارسال…' : remaining > 0 ? `ارسال مجدد تا ${remaining.toLocaleString('fa-IR')} ثانیه دیگر` : 'ارسال مجدد کد'}
        </button>
      </p>
      <Link href={backHref} className="inline-block text-violet-600 hover:text-violet-800">ویرایش شماره موبایل</Link>
      <p className="text-xs text-neutral-400">این کد تا ۵ دقیقه اعتبار دارد.</p>
    </div>
  </div>;
}
