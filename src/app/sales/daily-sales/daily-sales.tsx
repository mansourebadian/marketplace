'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createSale } from '@/actions/sales.actions';
import styles from './daily-sales.module.css';

const categories = [['SERVICE', 'خدمات'], ['ADD_ON', 'خدمات تکمیلی'], ['PRODUCT', 'محصولات'], ['SHIPPING', 'ارسال'], ['GIFT_CARD', 'کارت‌های هدیه'], ['PACKAGE', 'بسته‌ها'], ['MEMBERSHIP', 'عضویت‌ها'], ['LATE_CANCEL', 'هزینه لغو دیرهنگام'], ['NO_SHOW', 'هزینه عدم حضور']] as const;
const payments = [['CASH', 'نقدی'], ['OTHER', 'سایر روش‌ها'], ['GIFT_CARD', 'استفاده از کارت هدیه']] as const;
type Sale = { kind: string; category: string; paymentType: string; quantity: number; amount: number };
const num = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

export function DailySales({ today, date, sales, unavailable }: { today: string; date: string; sales: Sale[]; unavailable: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const label = new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00+03:30`));
  const go = (value: string) => router.push(`/sales/daily-sales?date=${encodeURIComponent(value)}`);
  const move = (days: number) => { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); go(value.toISOString().slice(0, 10)); };
  const sum = (items: Sale[], field: 'quantity' | 'amount') => items.reduce((total, item) => total + item[field], 0);
  const sold = sales.filter(item => item.kind === 'SALE');
  const refunded = sales.filter(item => item.kind === 'REFUND');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError('');
    startTransition(async () => {
      const result = await createSale({ ...values, date });
      if (result.error) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    });
  };
  const exportCsv = () => {
    const rows = [['نوع کالا', 'تعداد فروش', 'تعداد بازپرداخت', 'مبلغ فروش (تومان)'], ...categories.map(([key, name]) => [name, String(sum(sold.filter(item => item.category === key), 'quantity')), String(sum(refunded.filter(item => item.category === key), 'quantity')), String(sum(sold.filter(item => item.category === key), 'amount'))]), ['مجموع', String(sum(sold, 'quantity')), String(sum(refunded, 'quantity')), String(sum(sold, 'amount'))], [], ['روش پرداخت', 'دریافتی (تومان)', 'بازپرداخت (تومان)'], ...payments.map(([key, name]) => [name, String(sum(sold.filter(item => item.paymentType === key), 'amount')), String(sum(refunded.filter(item => item.paymentType === key), 'amount'))])];
    const csv = '\ufeff' + rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `daily-sales-${date}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <section className={styles.page} aria-labelledby="daily-sales-title">
    <div className={styles.heading}><div><h1 id="daily-sales-title">فروش روزانه</h1><p>تراکنش‌ها و گردش وجوه روزانه را مشاهده و بررسی کنید.</p></div><div className={styles.actions}><button type="button" className={styles.export} onClick={exportCsv} disabled={unavailable}>دریافت خروجی</button><button type="button" className={styles.add} disabled={unavailable} onClick={() => { setError(''); setOpen(true); }}>افزودن جدید</button></div></div>
    <div className={styles.dateControl} aria-label="انتخاب روز"><button type="button" onClick={() => move(-1)} aria-label="روز قبل"><ChevronRight size={17} /></button><button type="button" onClick={() => go(today)}>امروز</button><label className={styles.dateLabel}><span>{label}</span><input aria-label="انتخاب تاریخ" type="date" value={date} onChange={event => { if (event.target.value) go(event.target.value); }} /></label><button type="button" onClick={() => move(1)} aria-label="روز بعد"><ChevronLeft size={17} /></button></div>
    <p className={styles.notice} role={unavailable ? 'alert' : undefined}>{unavailable ? 'دریافت اطلاعات فروش ممکن نیست. وضعیت اتصال و راه‌اندازی پایگاه داده را بررسی کنید.' : 'مبالغ به تومان هستند و بر اساس تراکنش‌های ثبت‌شده برای روز انتخابی نمایش داده می‌شوند.'}</p>
    {!unavailable && <div className={styles.grid}>
      <section className={styles.card}><h2>خلاصه تراکنش‌ها</h2><div className={styles.tableScroll}><table><thead><tr><th>نوع کالا</th><th>تعداد فروش</th><th>تعداد بازپرداخت</th><th>مبلغ فروش</th></tr></thead><tbody>{categories.map(([key, name]) => <tr key={key}><td>{name}</td><td>{num(sum(sold.filter(item => item.category === key), 'quantity'))}</td><td>{num(sum(refunded.filter(item => item.category === key), 'quantity'))}</td><td>{num(sum(sold.filter(item => item.category === key), 'amount'))}</td></tr>)}<tr><td>مبلغ بازپرداخت</td><td>—</td><td>—</td><td>{num(sum(refunded, 'amount'))}</td></tr><tr className={styles.total}><td>مجموع فروش</td><td>{num(sum(sold, 'quantity'))}</td><td>{num(sum(refunded, 'quantity'))}</td><td>{num(sum(sold, 'amount'))}</td></tr></tbody></table></div></section>
      <section className={styles.card}><h2>خلاصه گردش وجوه</h2><div className={styles.tableScroll}><table><thead><tr><th>روش پرداخت</th><th>پرداخت‌های دریافتی</th><th>بازپرداخت‌ها</th></tr></thead><tbody>{payments.map(([key, name]) => <tr key={key}><td>{name}</td><td>{num(sum(sold.filter(item => item.paymentType === key), 'amount'))}</td><td>{num(sum(refunded.filter(item => item.paymentType === key), 'amount'))}</td></tr>)}<tr className={styles.total}><td>مجموع</td><td>{num(sum(sold, 'amount'))}</td><td>{num(sum(refunded, 'amount'))}</td></tr></tbody></table></div></section>
    </div>}
    {open && <div className={styles.overlay}><div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="sale-title"><h2 id="sale-title">ثبت تراکنش</h2><p>تراکنش برای {label} ثبت می‌شود.</p><form onSubmit={submit} className={styles.form}>
      <label>نوع تراکنش<select name="kind"><option value="SALE">فروش و دریافت وجه</option><option value="REFUND">بازپرداخت</option></select></label>
      <label>نوع کالا یا خدمت<select name="category">{categories.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label>روش پرداخت<select name="paymentType">{payments.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      <label>تعداد<input type="number" name="quantity" min="1" max="100000" defaultValue="1" required /></label>
      <label>مبلغ کل (تومان)<input type="number" name="amount" min="0" max="2147483647" required /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}><button type="button" onClick={() => setOpen(false)} disabled={pending}>انصراف</button><button type="submit" disabled={pending}>{pending ? 'در حال ثبت...' : 'ثبت تراکنش'}</button></div>
    </form></div></div>}
  </section>;
}
