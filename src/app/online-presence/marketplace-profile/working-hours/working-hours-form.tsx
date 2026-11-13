'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, X } from 'lucide-react';
import { saveHours } from './save-hours';
import styles from './working-hours.module.css';

type Hours = { day: number; enabled: boolean; opensAt: string; closesAt: string; secondOpensAt: string | null; secondClosesAt: string | null };
const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

export function WorkingHoursForm({ initialHours }: { initialHours: Hours[] }) {
  const [hours, setHours] = useState<Hours[]>(() => days.map((_, day) => initialHours.find(value => value.day === day) ?? { day, enabled: initialHours.length === 0 && day !== 6, opensAt: '10:00', closesAt: '19:00', secondOpensAt: null, secondClosesAt: null }));
  const [error, setError] = useState('');
  const [copyDay, setCopyDay] = useState<number | null>(null);
  const update = (day: number, patch: Partial<Hours>) => { setError(''); setHours(current => current.map(value => value.day === day ? { ...value, ...patch } : value)); };
  return <main className={styles.page} dir="rtl"><form action={saveHours} onSubmit={event => {
    const invalid = hours.find(value => value.enabled && (value.opensAt >= value.closesAt || (value.secondOpensAt !== null && (value.secondClosesAt === null || value.closesAt > value.secondOpensAt || value.secondOpensAt >= value.secondClosesAt))));
    if (invalid) {
      event.preventDefault();
      const reversed = invalid.opensAt >= invalid.closesAt || (invalid.secondOpensAt !== null && invalid.secondClosesAt !== null && invalid.secondOpensAt >= invalid.secondClosesAt);
      setError(reversed ? `${days[invalid.day]}: ساعت شروع باید قبل از ساعت پایان باشد. ساعت سمت چپ شروع و ساعت سمت راست پایان است.` : `${days[invalid.day]}: بازه‌های کاری نباید هم‌پوشانی داشته باشند.`);
    }
  }}>
    <header className={styles.header}><div className={styles.progress} aria-label="مرحله اول انتشار پروفایل"><span /><span /><span /></div><nav className={styles.navigation} aria-label="ناوبری مراحل"><div className={styles.actions}><button className={styles.save} type="submit" name="destination" value="exit">ذخیره و خروج</button><button className={styles.continue} type="submit" name="destination" value="showcase">ادامه <span aria-hidden="true">←</span></button><button className={styles.preview} type="button" disabled>پیش‌نمایش</button></div><Link href="/online-presence/marketplace-profile/location" className={styles.back} aria-label="بازگشت"><ArrowRight size={21}/></Link></nav></header>
    <section className={styles.content}><h1>ساعت‌های کاری خود را اضافه کنید</h1><p className={styles.subtitle}>ساعت‌های معمول کاری به مشتریان در پروفایل شما نمایش داده می‌شود و روی شیفت‌های برنامه‌ریزی‌شده تأثیری ندارد.</p>
      <div className={styles.days} aria-label="روزهای کاری">{hours.map(value => <button key={value.day} type="button" aria-pressed={value.enabled} className={value.enabled ? styles.dayActive : styles.day} onClick={() => update(value.day, { enabled: !value.enabled })}>{days[value.day]}</button>)}</div>
      <input type="hidden" name="hours" value={JSON.stringify(hours)}/>
      <p className={styles.timeHint}>در هر ردیف، ساعت شروع سمت چپ و ساعت پایان سمت راست است.</p>
      <div className={styles.rows}>{hours.filter(value => value.enabled).map(value => <div className={styles.dayRow} key={value.day}><div className={styles.dayName}><strong>{days[value.day]}</strong><span>باز است</span></div><div className={styles.intervals}>
        <div className={styles.row}><label><span className={styles.srOnly}>ساعت شروع بازه اول {days[value.day]}</span><input type="text" required inputMode="text" dir="ltr" placeholder="HH:MM" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} title="ساعت را به صورت ۲۴ ساعته، مانند 14:30 وارد کنید" value={value.opensAt} onChange={event => update(value.day, { opensAt: event.target.value })}/></label><span className={styles.until}>تا</span><label><span className={styles.srOnly}>ساعت پایان بازه اول {days[value.day]}</span><input type="text" required inputMode="text" dir="ltr" placeholder="HH:MM" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} title="ساعت را به صورت ۲۴ ساعته، مانند 14:30 وارد کنید" value={value.closesAt} onChange={event => update(value.day, { closesAt: event.target.value })}/></label>{value.secondOpensAt === null ? <button type="button" className={styles.intervalButton} aria-label={`افزودن بازه برای ${days[value.day]}`} onClick={() => { update(value.day, { secondOpensAt: value.closesAt, secondClosesAt: value.closesAt < '23:00' ? '23:00' : '23:59' }); setCopyDay(value.day); }}><Plus size={20}/></button> : <button type="button" className={styles.removeButton} aria-label={`حذف بازه اول ${days[value.day]}`} onClick={() => { update(value.day, { opensAt: value.secondOpensAt!, closesAt: value.secondClosesAt!, secondOpensAt: null, secondClosesAt: null }); setCopyDay(null); }}><X size={20}/></button>}</div>
        {value.secondOpensAt !== null && <><div className={styles.row}><label><span className={styles.srOnly}>ساعت شروع بازه دوم {days[value.day]}</span><input type="text" required inputMode="text" dir="ltr" placeholder="HH:MM" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} title="Enter a 24-hour time, e.g. 14:30" value={value.secondOpensAt} onChange={event => update(value.day, { secondOpensAt: event.target.value })}/></label><span className={styles.until}>تا</span><label><span className={styles.srOnly}>ساعت پایان بازه دوم {days[value.day]}</span><input type="text" required inputMode="text" dir="ltr" placeholder="HH:MM" pattern="([01][0-9]|2[0-3]):[0-5][0-9]" maxLength={5} title="Enter a 24-hour time, e.g. 14:30" value={value.secondClosesAt ?? ''} onChange={event => update(value.day, { secondClosesAt: event.target.value })}/></label><button type="button" className={styles.removeButton} aria-label={`حذف بازه دوم ${days[value.day]}`} onClick={() => { update(value.day, { secondOpensAt: null, secondClosesAt: null }); setCopyDay(null); }}><X size={20}/></button></div>{copyDay === value.day && <div className={styles.copyPrompt}><span>این ساعت‌ها برای روزهای کاری دیگر هم اعمال شود؟</span><button type="button" onClick={() => { setHours(current => current.map(item => item.enabled && item.day !== value.day ? { ...item, opensAt: value.opensAt, closesAt: value.closesAt, secondOpensAt: value.secondOpensAt, secondClosesAt: value.secondClosesAt } : item)); setCopyDay(null); }}>بله، کپی کن</button></div>}</>}
      </div></div>)}</div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>
  </form></main>;
}
