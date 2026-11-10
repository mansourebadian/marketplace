'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorianEn from 'react-date-object/locales/gregorian_en';
import styles from './team-member-form.module.css';

export function PersianDateField({ name, label, initialValue }: { name: string; label: string; initialValue?: string | null }) {
  const [date, setDate] = useState<DateObject | null>(() => initialValue ? new DateObject({ date: initialValue, format: 'YYYY-MM-DD', calendar: gregorian, locale: gregorianEn }).convert(persian, persianFa) : null);
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!fieldRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  const value = date ? new DateObject(date).convert(gregorian, gregorianEn).format('YYYY-MM-DD') : '';
  return <div className={styles.dateField} ref={fieldRef}>
    <span className={styles.dateLabel} id={`${name}-label`}>{label}</span>
    <input type="hidden" name={name} value={value} />
    <button ref={buttonRef} type="button" className={styles.dateButton} aria-labelledby={`${name}-label ${name}-value`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(current => !current)}><span id={`${name}-value`}>{date ? date.format('D MMMM YYYY') : 'انتخاب تاریخ'}</span><CalendarDays size={19} aria-hidden="true" /></button>
    {open && <div className={styles.datePopover} role="dialog" aria-label={`انتخاب ${label}`}>
      <Calendar value={date} onChange={value => { setDate(value); setOpen(false); buttonRef.current?.focus(); }} calendar={persian} locale={persianFa} shadow={false} />
      {date && <button type="button" className={styles.clearDate} onClick={() => { setDate(null); setOpen(false); buttonRef.current?.focus(); }}>پاک کردن تاریخ</button>}
    </div>}
  </div>;
}
