'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Store, Trash2 } from 'lucide-react';
import { periodMinutes, type ShiftPeriod } from '@/lib/recurring-shifts';
import { PersianDateInput } from './persian-date-input';
import styles from './repeating.module.css';

const weekdays = [{ id: 6, name: 'شنبه' }, { id: 0, name: 'یکشنبه' }, { id: 1, name: 'دوشنبه' }, { id: 2, name: 'سه‌شنبه' }, { id: 3, name: 'چهارشنبه' }, { id: 4, name: 'پنجشنبه' }, { id: 5, name: 'جمعه' }];
const initialDays = () => Array.from({ length: 7 }, () => [] as ShiftPeriod[]);
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function hours(minutes: number) { return `${new Intl.NumberFormat('fa-IR').format(Math.floor(minutes / 60))} ساعت${minutes % 60 ? ` و ${new Intl.NumberFormat('fa-IR').format(minutes % 60)} دقیقه` : ''}`; }

export function RepeatingForm({ memberKey, memberName, businessName, businessAddress, initial }: { memberKey: string; memberName: string; businessName: string; businessAddress: string; initial: { startDate: string; endDate: string | null; interval: number; days: string } | null }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initial?.startDate || today);
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [ends, setEnds] = useState(initial?.endDate ? 'date' : 'never');
  const [interval, setInterval] = useState(initial?.interval || 1);
  const [days, setDays] = useState<ShiftPeriod[][]>(() => { try { const parsed = initial && JSON.parse(initial.days); return Array.isArray(parsed) && parsed.length === 7 ? parsed : initialDays(); } catch { return initialDays(); } });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function update(day: number, next: ShiftPeriod[]) { setDays(current => current.map((periods, index) => index === day ? next : periods)); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (ends === 'date' && (!endDate || endDate < startDate)) { setError('تاریخ پایان باید در روز شروع یا پس از آن باشد.'); return; }
    if (days.some(day => { const sorted = [...day].sort((a, b) => a.start.localeCompare(b.start)); return sorted.some((period, i) => !period.start || !period.end || period.start >= period.end || (i > 0 && sorted[i - 1].end > period.start)); })) { setError('ساعت پایان باید پس از شروع باشد و بازه‌های یک روز نباید تداخل داشته باشند.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/team/recurring-shifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberKey, startDate, endDate: ends === 'date' ? endDate : null, interval, days }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'ذخیره برنامه انجام نشد.'); return; }
      router.push('/team/scheduled-shifts'); router.refresh();
    } catch { setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.'); } finally { setSaving(false); }
  }
  return <main dir="rtl" className={styles.page}><form onSubmit={save}><header className={styles.top}><Link href="/team/scheduled-shifts">بستن</Link><button type="submit" disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره'}</button></header><div className={styles.content}><h1>تنظیم شیفت‌های تکراری {memberName}</h1><p className={styles.subtitle}>ساعت حضور را برای روزهای هفته مشخص کنید. برنامه از تاریخ شروع انتخاب‌شده اعمال می‌شود.</p><div className={styles.columns}><aside><div className={styles.location}><span><Store size={22} /></span><div><strong>{businessName}</strong><small>{businessAddress}</small></div></div><div className={styles.settings}><label>نوع برنامه<select value={interval} onChange={event => setInterval(Number(event.target.value))}><option value={1}>هر هفته</option><option value={2}>هر دو هفته</option></select></label><PersianDateInput label="تاریخ شروع" value={startDate} onChange={setStartDate} /><label>پایان<select value={ends} onChange={event => setEnds(event.target.value)}><option value="never">بدون تاریخ پایان</option><option value="date">در تاریخ مشخص</option></select></label>{ends === 'date' && <PersianDateInput label="تاریخ پایان" value={endDate} onChange={setEndDate} min={startDate} />}</div><p className={styles.note}>شیفت‌هایی که برای یک تاریخ به‌صورت جداگانه ثبت شده‌اند، بر برنامه تکراری اولویت دارند.</p></aside><section className={styles.schedule}><h2>برنامه هفتگی</h2><p>{hours(days.flat().reduce((total, period) => total + Math.max(0, periodMinutes(period)), 0))} در مجموع</p>{weekdays.map(day => <div key={day.id} className={styles.day}><label className={styles.dayName}><input type="checkbox" checked={days[day.id].length > 0} onChange={event => update(day.id, event.target.checked ? [{ start: '09:00', end: '17:00' }] : [])} /><span>{day.name}<small>{days[day.id].length > 0 && hours(days[day.id].reduce((total, period) => total + Math.max(0, periodMinutes(period)), 0))}</small></span></label><div className={styles.periods}>{days[day.id].length === 0 ? <span className={styles.off}>بدون شیفت</span> : days[day.id].map((period, index) => <div className={styles.period} key={index}><input type="time" aria-label={`شروع ${day.name} بازه ${index + 1}`} required value={period.start} onChange={event => update(day.id, days[day.id].map((item, i) => i === index ? { ...item, start: event.target.value } : item))} /><span>تا</span><input type="time" aria-label={`پایان ${day.name} بازه ${index + 1}`} required value={period.end} onChange={event => update(day.id, days[day.id].map((item, i) => i === index ? { ...item, end: event.target.value } : item))} /><button type="button" aria-label={`افزودن بازه به ${day.name}`} disabled={days[day.id].length >= 10} onClick={() => update(day.id, [...days[day.id], { start: '17:00', end: '18:00' }])}><Plus size={19} /></button><button type="button" className={styles.trash} aria-label={`حذف بازه ${index + 1} ${day.name}`} onClick={() => update(day.id, days[day.id].filter((_, i) => i !== index))}><Trash2 size={18} /></button></div>)}</div></div>)}{error && <p role="alert" className={styles.error}>{error}</p>}</section></div></div></form></main>;
}
