'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from 'react-multi-date-picker';
import DateObject from 'react-date-object';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorianEn from 'react-date-object/locales/gregorian_en';
import persian from 'react-date-object/calendars/persian';
import persianFa from 'react-date-object/locales/persian_fa';
import styles from './repeating.module.css';

function toPersian(value: string) {
  return new DateObject({ date: value, format: 'YYYY-MM-DD', calendar: gregorian, locale: gregorianEn }).convert(persian, persianFa);
}

export function PersianDateInput({ label, value, onChange, min }: { label: string; value: string; onChange: (value: string) => void; min?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className={styles.dateField} ref={root}>
    <span id={`${label}-label`}>{label}</span>
    <button ref={trigger} type="button" className={styles.dateButton} aria-labelledby={`${label}-label ${label}-value`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(current => !current)}><span id={`${label}-value`}>{value ? toPersian(value).format('D MMMM YYYY') : 'انتخاب تاریخ'}</span><CalendarDays size={19} aria-hidden="true" /></button>
    {open && <div className={styles.datePopover} role="dialog" aria-label={`انتخاب ${label}`}><Calendar value={value ? toPersian(value) : null} minDate={min ? toPersian(min) : undefined} calendar={persian} locale={persianFa} shadow={false} onChange={date => { if (date) { onChange(new DateObject(date).convert(gregorian, gregorianEn).format('YYYY-MM-DD')); setOpen(false); trigger.current?.focus(); } }} /></div>}
  </div>;
}
