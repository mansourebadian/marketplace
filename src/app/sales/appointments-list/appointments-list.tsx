'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CalendarPlus, CalendarX, Check, ChevronDown, EyeOff, Info, Mail, MapPin, Phone, Play, Search, ThumbsUp, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { checkCancellationEligibility, undoNoShow, updateAppointmentStatus } from './actions';
import styles from './appointments-list.module.css';

type Row = { id: string; reference: string; client: string; email: string; phone: string; customerCreatedAt: string; note: string; total: number; service: string; createdAt: string; startsAt: string; duration: number; member: string; price: number; status: string };
const labels: Record<string, string> = { BOOKED: 'رزروشده', CONFIRMED: 'تأییدشده', ARRIVED: 'مراجعه کرده', STARTED: 'شروع‌شده', TEST_CONFIRMED: 'آزمایشی', CANCELLED: 'لغوشده', COMPLETED: 'تکمیل‌شده', NO_SHOW: 'عدم حضور' };
const statusOptions = [
  { label: 'رزروشده', icon: CalendarPlus, status: 'BOOKED' },
  { label: 'تأییدشده', icon: ThumbsUp, status: 'CONFIRMED' },
  { label: 'مراجعه کرده', icon: MapPin, status: 'ARRIVED' },
  { label: 'شروع‌شده', icon: Play, status: 'STARTED' },
  { label: 'عدم حضور', icon: EyeOff, status: 'NO_SHOW', danger: true },
  { label: 'لغوشده', icon: CalendarX, status: 'CANCELLED', danger: true },
];
const number = (value: number) => new Intl.NumberFormat('fa-IR').format(value);
const date = (value: string) => new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const cancellationReasons = [
  { value: '', label: 'بدون دلیل' },
  { value: 'DUPLICATE_APPOINTMENT', label: 'نوبت تکراری' },
  { value: 'BOOKED_BY_MISTAKE', label: 'ثبت اشتباهی نوبت' },
  { value: 'CLIENT_UNAVAILABLE', label: 'عدم امکان حضور مشتری' },
];
function CancellationReasonMenu({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [open]);
  const focusOption = (index: number) => container.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')[index]?.focus();
  return <div className={styles.cancelReason} ref={container} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <span id="cancellation-reason-label">دلیل لغو (اختیاری)</span>
    <button ref={trigger} type="button" className={styles.cancelReasonTrigger} disabled={disabled} aria-labelledby="cancellation-reason-label cancellation-reason-value" aria-haspopup="menu" aria-expanded={open} aria-controls="cancellation-reason-menu" onClick={() => setOpen(current => !current)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); requestAnimationFrame(() => focusOption(event.key === 'ArrowDown' ? 0 : cancellationReasons.length - 1)); } }}>
      <span id="cancellation-reason-value">{cancellationReasons.find(reason => reason.value === value)?.label}</span><ChevronDown size={17} />
    </button>
    {open && <div id="cancellation-reason-menu" role="menu" aria-labelledby="cancellation-reason-label" className={styles.cancelReasonMenu} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); return; }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const options = Array.from(container.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
        const current = options.indexOf(document.activeElement as HTMLButtonElement);
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : event.key === 'ArrowDown' ? (current + 1) % options.length : (current - 1 + options.length) % options.length;
        options[index]?.focus();
      }
    }}>
      {cancellationReasons.map(reason => <button key={reason.value} type="button" role="menuitemradio" aria-checked={value === reason.value} onClick={() => { onChange(reason.value); setOpen(false); trigger.current?.focus(); }}><span>{reason.label}</span>{value === reason.value && <Check size={19} aria-hidden="true" />}</button>)}
    </div>}
  </div>;
}
const dayKey = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

export function AppointmentsList({ rows, unavailable }: { rows: Row[]; unavailable: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [exportOpen, setExportOpen] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmNoShow, setConfirmNoShow] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [pastCancellationWarning, setPastCancellationWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const noShowRef = useRef<HTMLDivElement>(null);
  const noShowCloseRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLDivElement>(null);
  const cancelCloseRef = useRef<HTMLButtonElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const warningCloseRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!selected) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (pastCancellationWarning) { setPastCancellationWarning(false); statusRef.current?.querySelector('button')?.focus(); }
        else if (confirmCancel && !saving) { setConfirmCancel(false); setStatusError(''); }
        else if (confirmCancel) return;
        else if (confirmNoShow && !saving) { setConfirmNoShow(false); setStatusError(''); }
        else if (confirmNoShow) return;
        else if (statusOpen) { setStatusOpen(false); statusRef.current?.querySelector('button')?.focus(); }
        else { setSelected(null); triggerRef.current?.focus(); }
      }
      if (event.key === 'Tab') {
        const buttons = (pastCancellationWarning ? warningRef : confirmCancel ? cancelRef : confirmNoShow ? noShowRef : drawerRef).current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled), a[href]');
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [selected, statusOpen, confirmNoShow, confirmCancel, saving, pastCancellationWarning]);
  useEffect(() => { if (selected) (confirmCancel ? cancelCloseRef : confirmNoShow ? noShowCloseRef : closeRef).current?.focus(); }, [selected, confirmNoShow, confirmCancel]);
  useEffect(() => { if (pastCancellationWarning) warningCloseRef.current?.focus(); }, [pastCancellationWarning]);
  useEffect(() => {
    if (!statusOpen) return;
    const close = (event: MouseEvent) => { if (!statusRef.current?.contains(event.target as Node)) setStatusOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [statusOpen]);
  const closeDrawer = () => { setStatusOpen(false); setConfirmNoShow(false); setConfirmCancel(false); setPastCancellationWarning(false); setSelected(null); triggerRef.current?.focus(); };
  const closeWarning = () => { setPastCancellationWarning(false); statusRef.current?.querySelector('button')?.focus(); };
  async function restoreNoShow() {
    if (!selected || saving) return;
    setSaving(true);
    setStatusError('');
    try {
      const result = await undoNoShow({ id: selected.reference });
      if (result.error || !result.status) setStatusError(result.error || 'بازگرداندن نوبت انجام نشد.');
      else { setSelected(current => current ? { ...current, status: result.status! } : current); setStatusOpen(false); router.refresh(); }
    } catch { setStatusError('بازگرداندن نوبت انجام نشد. دوباره تلاش کنید.'); }
    finally { setSaving(false); }
  }
  async function openCancellation() {
    if (!selected || saving) return;
    setSaving(true);
    setStatusError('');
    try {
      const result = await checkCancellationEligibility({ id: selected.reference, previous: selected.status });
      setStatusOpen(false);
      if (result.code === 'PAST_APPOINTMENT') setPastCancellationWarning(true);
      else if (result.error) setStatusError(result.error);
      else { setCancellationReason(''); setConfirmCancel(true); }
    } catch { setStatusError('بررسی نوبت انجام نشد. دوباره تلاش کنید.'); }
    finally { setSaving(false); }
  }
  async function changeStatus(next: string) {
    if (!selected || saving) return;
    if (next === selected.status) { setStatusOpen(false); return; }
    setSaving(true);
    setStatusError('');
    try {
      const result = await updateAppointmentStatus({ id: selected.reference, previous: selected.status, status: next, ...(next === 'CANCELLED' && cancellationReason ? { cancellationReason } : {}) });
      if (result.code === 'PAST_APPOINTMENT') { setStatusOpen(false); setConfirmCancel(false); setPastCancellationWarning(true); }
      else if (result.error) { setStatusError(result.error); router.refresh(); }
      else { setSelected(current => current ? { ...current, status: next } : current); setStatusOpen(false); setConfirmNoShow(false); setConfirmCancel(false); router.refresh(); }
    } catch { setStatusError('ثبت وضعیت انجام نشد. دوباره تلاش کنید.'); }
    finally { setSaving(false); }
  }
  const filtered = useMemo(() => {
    const today = dayKey(new Date());
    const month = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric' }).format(new Date());
    const search = query.trim().toLocaleLowerCase('fa-IR');
    return rows.filter(row => (!search || [row.reference, row.client, row.service, row.member].some(value => value.toLocaleLowerCase('fa-IR').includes(search))) && (status === 'all' || row.status === status) && (period === 'all' || (period === 'today' ? dayKey(new Date(row.startsAt)) === today : new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric' }).format(new Date(row.startsAt)) === month && dayKey(new Date(row.startsAt)) <= today))).sort((a, b) => sort === 'oldest' ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt));
  }, [rows, query, period, status, sort]);
  const headings = ['شناسه نوبت', 'مشتری', 'خدمت', 'تاریخ ثبت', 'تاریخ نوبت', 'مدت (دقیقه)', 'عضو تیم', 'مبلغ (تومان)', 'وضعیت'];
  const values = filtered.map(row => [row.reference, row.client, row.service, date(row.createdAt), date(row.startsAt), row.duration, row.member, row.price, labels[row.status] || row.status]);
  function csv() { const safe = (v: string | number) => '"' + String(v).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"'; download(new Blob(['\ufeff' + [headings, ...values].map(line => line.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'appointments.csv'); setExportOpen(false); }
  async function excel() { try { const ExcelJS = await import('exceljs'); const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('نوبت‌ها', { views: [{ rightToLeft: true }] }); sheet.addRow(headings); values.forEach(row => sheet.addRow(row)); sheet.columns.forEach(column => { column.width = 23; }); sheet.getRow(1).font = { bold: true }; const buffer = await workbook.xlsx.writeBuffer(); download(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'appointments.xlsx'); setError(''); } catch { setError('ساخت فایل اکسل انجام نشد.'); } setExportOpen(false); }
  return <section className={styles.page} aria-labelledby="appointments-title">
    <div className={styles.heading}><div><h1 id="appointments-title">نوبت‌ها</h1><p>نوبت‌های ثبت‌شده مشتریان را مشاهده، فیلتر و دریافت کنید.</p></div><div className={styles.exportWrap}><button className={styles.pill} type="button" disabled={unavailable} aria-expanded={exportOpen} onClick={() => setExportOpen(open => !open)}>دریافت خروجی <ChevronDown size={16} /></button>{exportOpen && <div className={styles.exportMenu}><button type="button" onClick={csv}>CSV</button><button type="button" onClick={() => void excel()}>Excel</button></div>}</div></div>
    {unavailable ? <p role="alert" className={styles.error}>دریافت نوبت‌ها انجام نشد. لطفاً دوباره تلاش کنید.</p> : <><div className={styles.toolbar}><label className={styles.search}><Search size={17} /><input aria-label="جست‌وجوی نوبت" placeholder="جست‌وجو با شناسه یا نام مشتری" value={query} onChange={event => setQuery(event.target.value)} /></label><select className={styles.pill} aria-label="بازه زمانی" value={period} onChange={event => setPeriod(event.target.value)}><option value="all">همه زمان‌ها</option><option value="today">امروز</option><option value="month">از ابتدای ماه تا امروز</option></select><select className={styles.pill} aria-label="وضعیت نوبت" value={status} onChange={event => setStatus(event.target.value)}><option value="all">همه وضعیت‌ها</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select className={`${styles.pill} ${styles.sort}`} aria-label="مرتب‌سازی" value={sort} onChange={event => setSort(event.target.value)}><option value="newest">تاریخ نوبت (جدیدترین)</option><option value="oldest">تاریخ نوبت (قدیمی‌ترین)</option></select></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.tableWrap}><table><thead><tr>{['شناسه نوبت', 'مشتری', 'خدمت', 'ثبت‌کننده', 'تاریخ ثبت', 'تاریخ نوبت', 'مدت', 'عضو تیم', 'مبلغ', 'وضعیت'].map(heading => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><button type="button" className={styles.reference} dir="ltr" onClick={event => { triggerRef.current = event.currentTarget; setSelected(row); }} aria-label={`مشاهده جزئیات نوبت ${row.reference.slice(-8).toUpperCase()}`}>#{row.reference.slice(-8).toUpperCase()}</button></td><td>{row.client}</td><td>{row.service}</td><td>—</td><td>{date(row.createdAt)}</td><td>{date(row.startsAt)}</td><td>{number(row.duration)} دقیقه</td><td>{row.member}</td><td>{number(row.price)} تومان</td><td><span className={`${styles.badge} ${styles['badge_' + row.status] || ''}`}>{labels[row.status] || row.status}</span></td></tr>)}</tbody></table></div>
    {filtered.length === 0 ? <p className={styles.count}>نوبتی برای نمایش پیدا نشد.</p> : <p className={styles.count}>{number(filtered.length)} نوبت نمایش داده می‌شود.</p>}</>}
    {selected && !confirmNoShow && !confirmCancel && <div className={styles.overlay} onClick={closeDrawer}>
      <div ref={drawerRef} className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title" onClick={event => event.stopPropagation()}>
        <button ref={closeRef} type="button" className={styles.close} onClick={closeDrawer} aria-label="بستن جزئیات نوبت"><X size={22} /></button>
        <section className={styles.clientPanel} aria-label="اطلاعات مشتری">
          <div className={styles.avatar}>{selected.client.trim().charAt(0)}</div>
          <h2>{selected.client}</h2>
          {selected.email && <p className={styles.contact} dir="ltr"><Mail size={15} />{selected.email}</p>}
          {selected.phone && <p className={styles.contact} dir="ltr"><Phone size={15} />{selected.phone}</p>}
          <div className={styles.clientMeta}><CalendarDays size={18} /><span>تاریخ عضویت: {date(selected.customerCreatedAt)}</span></div>
        </section>
        <section className={styles.detailPanel}>
          <header className={`${styles.detailHeader} ${styles['status_' + selected.status] || ''}`}><div><h2 id="appointment-detail-title">{date(selected.startsAt)}</h2><p>شناسه نوبت: <bdi dir="ltr">#{selected.reference.slice(-8).toUpperCase()}</bdi></p></div><div ref={statusRef} className={styles.statusWrap}><button type="button" className={styles.statusButton} disabled={saving} aria-expanded={statusOpen} aria-controls="appointment-status-menu" onClick={() => setStatusOpen(open => !open)}>{saving ? 'در حال ثبت…' : (labels[selected.status] || selected.status)}<ChevronDown size={15} /></button>{statusOpen && <div id="appointment-status-menu" className={styles.statusMenu} aria-label="وضعیت نوبت"><ul>{selected.status === 'NO_SHOW' && <li><button type="button" disabled={saving} onClick={() => void restoreNoShow()}><CalendarPlus size={18} /><span>بازگرداندن عدم حضور</span></button></li>}{statusOptions.map(option => { const Icon = option.icon; const current = selected.status === option.status; const terminal = ['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(selected.status); return <li key={option.status}><button type="button" disabled={saving || (terminal && !current)} className={option.danger ? styles.statusDanger : undefined} onClick={() => { if (option.status === 'NO_SHOW' && !current) { setStatusError(''); setStatusOpen(false); setConfirmNoShow(true); } else if (option.status === 'CANCELLED' && !current) void openCancellation(); else void changeStatus(option.status); }}><Icon size={18} /><span>{option.label}</span>{current && <Check size={17} aria-label="وضعیت فعلی" />}</button></li>; })}</ul>{['CANCELLED', 'COMPLETED'].includes(selected.status) && <p>تغییر وضعیت نوبت لغوشده یا پایان‌یافته ممکن نیست.</p>}</div>}</div></header>
          {statusError && <p role="alert" className={styles.statusError}>{statusError}</p>}
          <div className={styles.detailBody}><h3>خدمات</h3>{rows.filter(row => row.reference === selected.reference).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map(row => <div key={row.id} className={styles.service}><div><strong>{row.service}</strong><p>{date(row.startsAt)} · {number(row.duration)} دقیقه · {row.member}</p></div><strong>{number(row.price)} تومان</strong></div>)}{selected.note && <div className={styles.note}><h3>یادداشت نوبت</h3><p>{selected.note}</p></div>}</div>
          <div className={styles.total}><span>مجموع نوبت</span><strong>{number(selected.total)} تومان</strong></div>
        </section>
      </div>
    </div>}
    {selected && pastCancellationWarning && <div className={styles.warningOverlay} onClick={closeWarning}>
      <div ref={warningRef} className={styles.warningDialog} role="alertdialog" aria-modal="true" aria-labelledby="cancel-warning-title" aria-describedby="cancel-warning-description" onClick={event => event.stopPropagation()}>
        <div className={styles.warningTitle}><h2 id="cancel-warning-title">امکان لغو نوبت وجود ندارد</h2><button ref={warningCloseRef} type="button" onClick={closeWarning} aria-label="بستن هشدار"><X size={21} /></button></div>
        <p id="cancel-warning-description">نوبت‌هایی که زمان شروع آن‌ها گذشته است قابل لغو نیستند. در صورت عدم مراجعهٔ مشتری، وضعیت نوبت را روی «عدم حضور» قرار دهید.</p>
        <button type="button" className={styles.warningBack} onClick={closeWarning}>بازگشت</button>
      </div>
    </div>}
    {selected && confirmCancel && <div ref={cancelRef} className={styles.noShowPage} role="dialog" aria-modal="true" aria-labelledby="cancel-title" dir="rtl">
      <div className={styles.noShowTop}><button ref={cancelCloseRef} type="button" className={styles.noShowClose} disabled={saving} onClick={() => { setConfirmCancel(false); setStatusError(''); }}>بستن</button></div>
      <main className={styles.noShowContent}>
        <h1 id="cancel-title">آیا از لغو نوبت مطمئن هستید؟</h1>
        <div className={styles.noShowColumns}>
          <div>
            <div className={styles.noShowInfo}><Info size={20} /><span>برای لغو این نوبت هزینه‌ای دریافت نمی‌شود.</span></div>
            <CancellationReasonMenu value={cancellationReason} onChange={setCancellationReason} disabled={saving} />
          </div>
          <aside className={styles.noShowSummary}><h2>جزئیات لغو</h2><div className={styles.noShowTotal}><span>مجموع نوبت</span><strong>{number(selected.total)} تومان</strong></div><p>هزینه‌ای دریافت نخواهد شد.</p>{statusError && <p role="alert" className={styles.noShowError}>{statusError}</p>}<button type="button" disabled={saving} onClick={() => void changeStatus('CANCELLED')}>{saving ? 'در حال ثبت…' : 'لغو نوبت'}</button></aside>
        </div>
      </main>
    </div>}
    {selected && confirmNoShow && <div ref={noShowRef} className={styles.noShowPage} role="dialog" aria-modal="true" aria-labelledby="no-show-title" dir="rtl">
      <div className={styles.noShowTop}><button ref={noShowCloseRef} type="button" className={styles.noShowClose} disabled={saving} onClick={() => { setConfirmNoShow(false); setStatusError(''); }}>بستن</button></div>
      <main className={styles.noShowContent}>
        <h1 id="no-show-title">آیا از ثبت عدم حضور مشتری مطمئن هستید؟</h1>
        <div className={styles.noShowColumns}>
          <div className={styles.noShowExplanation}>
            <div className={styles.noShowInfo}><Info size={20} /><span>برای ثبت عدم حضور این نوبت هزینه‌ای دریافت نمی‌شود.</span></div>
            <label className={styles.noShowNotification}><input type="checkbox" disabled /><span><strong>ارسال اعلان عدم حضور به مشتری</strong><small>ارسال اعلان برای عدم حضور در حال حاضر در دسترس نیست.</small></span></label>
          </div>
          <aside className={styles.noShowSummary}><h2>جزئیات عدم حضور</h2><div className={styles.noShowTotal}><span>مجموع نوبت</span><strong>{number(selected.total)} تومان</strong></div><p>هزینه‌ای دریافت نخواهد شد.</p>{statusError && <p role="alert" className={styles.noShowError}>{statusError}</p>}<button type="button" disabled={saving} onClick={() => void changeStatus('NO_SHOW')}>{saving ? 'در حال ثبت…' : 'ثبت عدم حضور'}</button></aside>
        </div>
      </main>
    </div>}
  </section>;
}
