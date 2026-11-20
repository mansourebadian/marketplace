'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import { createSale } from '@/actions/sales.actions';
import { QuickSale, type QuickSaleCustomer, type QuickSaleService } from './quick-sale';
import styles from './daily-sales.module.css';

const categories = [['SERVICE', 'خدمات'], ['ADD_ON', 'خدمات تکمیلی'], ['PRODUCT', 'محصولات'], ['SHIPPING', 'ارسال'], ['GIFT_CARD', 'کارت‌های هدیه'], ['PACKAGE', 'بسته‌ها'], ['MEMBERSHIP', 'عضویت‌ها'], ['LATE_CANCEL', 'هزینه لغو دیرهنگام'], ['NO_SHOW', 'هزینه عدم حضور']] as const;
const payments = [['CASH', 'نقدی'], ['OTHER', 'سایر روش‌ها'], ['GIFT_CARD', 'استفاده از کارت هدیه']] as const;
type Sale = { kind: string; category: string; paymentType: string; quantity: number; amount: number };
const num = (value: number) => new Intl.NumberFormat('fa-IR').format(value);

export function DailySales({ today, date, sales, services, customers, unavailable }: { today: string; date: string; sales: Sale[]; services: QuickSaleService[]; customers: QuickSaleCustomer[]; unavailable: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!exportOpen) return;
    const closeOutside = (event: PointerEvent) => { if (!exportRef.current?.contains(event.target as Node)) setExportOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setExportOpen(false); exportButtonRef.current?.focus(); } };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [exportOpen]);
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
  const transactionRows: (string | number)[][] = [['نوع کالا', 'تعداد فروش', 'تعداد بازپرداخت', 'مبلغ فروش (تومان)'], ...categories.map(([key, name]) => [name, sum(sold.filter(item => item.category === key), 'quantity'), sum(refunded.filter(item => item.category === key), 'quantity'), sum(sold.filter(item => item.category === key), 'amount')]), ['مبلغ بازپرداخت', '', '', sum(refunded, 'amount')], ['مجموع فروش', sum(sold, 'quantity'), sum(refunded, 'quantity'), sum(sold, 'amount')]];
  const paymentRows: (string | number)[][] = [['روش پرداخت', 'دریافتی (تومان)', 'بازپرداخت (تومان)'], ...payments.map(([key, name]) => [name, sum(sold.filter(item => item.paymentType === key), 'amount'), sum(refunded.filter(item => item.paymentType === key), 'amount')]), ['مجموع', sum(sold, 'amount'), sum(refunded, 'amount')]];
  const download = (blob: Blob, filename: string) => { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const exportCsv = () => {
    const rows = [...transactionRows, [], ...paymentRows];
    const csv = '\ufeff' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `daily-sales-${date}.csv`);
  };
  const exportExcel = async () => {
    try {
      setExportError('');
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('فروش روزانه', { views: [{ rightToLeft: true }] });
      sheet.columns = [{ width: 28 }, { width: 20 }, { width: 22 }, { width: 24 }];
      sheet.addRow(['فروش روزانه', label]);
      sheet.addRow([]);
      sheet.addRows(transactionRows);
      sheet.addRow([]);
      const paymentHeader = sheet.rowCount + 1;
      sheet.addRows(paymentRows);
      for (const rowNumber of [1, 3, paymentHeader]) sheet.getRow(rowNumber).font = { bold: true };
      sheet.eachRow(row => { row.alignment = { horizontal: 'right', vertical: 'middle', readingOrder: 'rtl' }; });
      const buffer = await workbook.xlsx.writeBuffer();
      download(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `daily-sales-${date}.xlsx`);
    } catch (error) {
      console.error('Exporting sales failed', error);
      setExportError('دریافت فایل اکسل انجام نشد. دوباره تلاش کنید.');
    }
  };
  const exportPdf = async () => {
    setExportOpen(false);
    setExportError('');
    try {
      const [{ createSalesPdf }, regular, bold] = await Promise.all([
        import('@/lib/sales-pdf'),
        fetch('/fonts/Vazirmatn-Regular.ttf'),
        fetch('/fonts/Vazirmatn-Bold.ttf'),
      ]);
      if (!regular.ok || !bold.ok) throw new Error('Unable to load report fonts');
      const bytes = createSalesPdf({ label, transactions: transactionRows, payments: paymentRows, regularFont: new Uint8Array(await regular.arrayBuffer()), boldFont: new Uint8Array(await bold.arrayBuffer()) });
      download(new Blob([bytes], { type: 'application/pdf' }), `daily-sales-${date}.pdf`);
    } catch (error) {
      console.error('Exporting PDF failed', error);
      setExportError('دریافت فایل PDF انجام نشد. دوباره تلاش کنید.');
    }
  };
  return <section className={styles.page} aria-labelledby="daily-sales-title">
    <div className={styles.heading}><div><h1 id="daily-sales-title">فروش روزانه</h1><p>تراکنش‌ها و گردش وجوه روزانه را مشاهده و بررسی کنید.</p></div><div className={styles.actions}><div className={styles.exportWrap} ref={exportRef}><button ref={exportButtonRef} type="button" className={styles.export} onClick={() => setExportOpen(value => !value)} disabled={unavailable} aria-expanded={exportOpen} aria-controls="sales-export-menu">دریافت خروجی <ChevronDown size={16} className={exportOpen ? styles.chevronOpen : undefined} /></button>{exportOpen && <div id="sales-export-menu" className={styles.exportMenu} aria-label="فرمت خروجی"><button type="button" onClick={() => { void exportPdf(); exportButtonRef.current?.focus(); }}><FileText size={18} /> PDF</button><button type="button" onClick={() => { exportCsv(); setExportOpen(false); exportButtonRef.current?.focus(); }}><FileText size={18} /> CSV</button><button type="button" onClick={() => { setExportOpen(false); void exportExcel(); exportButtonRef.current?.focus(); }}><FileSpreadsheet size={18} /> Excel</button></div>}</div><button type="button" className={styles.add} disabled={unavailable} onClick={() => setQuickSaleOpen(true)}>افزودن جدید</button></div></div>
    <div className={styles.dateControl} aria-label="انتخاب روز"><button type="button" onClick={() => move(-1)} aria-label="روز قبل"><ChevronRight size={17} /></button><button type="button" onClick={() => go(today)}>امروز</button><label className={styles.dateLabel}><span>{label}</span><input aria-label="انتخاب تاریخ" type="date" value={date} onChange={event => { if (event.target.value) go(event.target.value); }} /></label><button type="button" onClick={() => move(1)} aria-label="روز بعد"><ChevronLeft size={17} /></button></div>
    <p className={styles.notice} role={unavailable ? 'alert' : undefined}>{unavailable ? 'دریافت اطلاعات فروش ممکن نیست. وضعیت اتصال و راه‌اندازی پایگاه داده را بررسی کنید.' : 'مبالغ به تومان هستند و بر اساس تراکنش‌های ثبت‌شده برای روز انتخابی نمایش داده می‌شوند.'}</p>
    {exportError && <p className={styles.error} role="alert">{exportError}</p>}
    {!unavailable && <div className={styles.grid}>
      <section className={styles.card}><h2>خلاصه تراکنش‌ها</h2><div className={styles.tableScroll}><table><thead><tr><th>نوع کالا</th><th>تعداد فروش</th><th>تعداد بازپرداخت</th><th>مبلغ فروش</th></tr></thead><tbody>{categories.map(([key, name]) => <tr key={key}><td>{name}</td><td>{num(sum(sold.filter(item => item.category === key), 'quantity'))}</td><td>{num(sum(refunded.filter(item => item.category === key), 'quantity'))}</td><td>{num(sum(sold.filter(item => item.category === key), 'amount'))}</td></tr>)}<tr><td>مبلغ بازپرداخت</td><td>—</td><td>—</td><td>{num(sum(refunded, 'amount'))}</td></tr><tr className={styles.total}><td>مجموع فروش</td><td>{num(sum(sold, 'quantity'))}</td><td>{num(sum(refunded, 'quantity'))}</td><td>{num(sum(sold, 'amount'))}</td></tr></tbody></table></div></section>
      <section className={styles.card}><h2>خلاصه گردش وجوه</h2><div className={styles.tableScroll}><table><thead><tr><th>روش پرداخت</th><th>پرداخت‌های دریافتی</th><th>بازپرداخت‌ها</th></tr></thead><tbody>{payments.map(([key, name]) => <tr key={key}><td>{name}</td><td>{num(sum(sold.filter(item => item.paymentType === key), 'amount'))}</td><td>{num(sum(refunded.filter(item => item.paymentType === key), 'amount'))}</td></tr>)}<tr className={styles.total}><td>مجموع</td><td>{num(sum(sold, 'amount'))}</td><td>{num(sum(refunded, 'amount'))}</td></tr></tbody></table></div></section>
    </div>}
    {quickSaleOpen && <QuickSale date={date} services={services} customers={customers} onClose={() => setQuickSaleOpen(false)} onManual={() => { setQuickSaleOpen(false); setError(''); setOpen(true); }} onSaved={() => { setQuickSaleOpen(false); router.refresh(); }} />}
    {open && <div className={styles.overlay}><div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="sale-title"><h2 id="sale-title">ثبت تراکنش</h2><p>تراکنش برای {label} ثبت می‌شود.</p><form onSubmit={submit} className={styles.form}>
      <label>مشتری<select name="customerId" defaultValue=""><option value="">مشتری حضوری (بدون نام)</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.phone || customer.email}</option>)}</select></label>
      <p>برای نمایش مبلغ در فهرست مشتریان، مشتری را انتخاب کنید.</p>
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
