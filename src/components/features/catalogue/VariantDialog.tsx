'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import styles from './ServiceForm.module.css';

type VariantExtraTime = { type: 'PROCESSING' | 'BLOCKED' | 'EXTRA_SERVICE'; minutes: number };
export type Variant = { name: string; description: string; sku: string; priceType: 'FREE' | 'STARTS_AT' | 'FIXED'; price: number; durationMin: number; extraTimes: VariantExtraTime[] };

function parsePrice(value: string): number | null {
  const normalized = value.trim().replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}

export function VariantDialog({ open, onClose, onSave, durations, formatDuration }: { open: boolean; onClose: () => void; onSave: (variant: Variant) => void; durations: number[]; formatDuration: (minutes: number) => string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [section, setSection] = useState<'details' | 'settings'>('details');
  const [priceType, setPriceType] = useState<Variant['priceType']>('FIXED');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('60');
  const [error, setError] = useState('');
  const [extraTimes, setExtraTimes] = useState<VariantExtraTime[]>([]);

  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  function save() {
    const parsedPrice = priceType === 'FREE' ? 0 : parsePrice(price);
    if (parsedPrice === null) { setSection('details'); setError(price.trim() ? 'قیمت معتبر وارد کنید.' : 'وارد کردن قیمت الزامی است.'); return; }
    onSave({ name: name.trim(), description: description.trim(), sku: sku.trim(), priceType, price: parsedPrice, durationMin: Number(duration), extraTimes });
    setName(''); setDescription(''); setSku(''); setSection('details'); setPriceType('FIXED'); setPrice(''); setDuration('60'); setError(''); setExtraTimes([]);
  }

  return <dialog ref={dialog} className={styles.variantDialog} aria-labelledby="variant-title" onClose={() => { setName(''); setDescription(''); setSku(''); setSection('details'); setPriceType('FIXED'); setPrice(''); setDuration('60'); setExtraTimes([]); setError(''); onClose(); }}>
    <form onSubmit={event => { event.preventDefault(); save(); }}>
      <header className={styles.variantHeader}><h2 id="variant-title">افزودن حالت خدمت</h2><button type="button" onClick={onClose} aria-label="بستن"><X size={22} /></button></header>
      <div className={styles.variantLayout}>
        <nav className={styles.variantSidebar} aria-label="بخش‌های حالت خدمت"><button type="button" className={section === 'details' ? styles.variantTabActive : ''} aria-current={section === 'details' ? 'page' : undefined} onClick={() => setSection('details')}>اطلاعات اصلی</button><button type="button" className={section === 'settings' ? styles.variantTabActive : ''} aria-current={section === 'settings' ? 'page' : undefined} onClick={() => setSection('settings')}>تنظیمات</button></nav>
        <div className={styles.variantBody}>
          <div hidden={section !== 'details'}>
          <h3>اطلاعات اصلی</h3>
          <label className={styles.field}><span>نام حالت خدمت (اختیاری)<small>{name.length.toLocaleString('fa-IR')} / ۵۰</small></span><input value={name} maxLength={50} onChange={event => setName(event.target.value)} placeholder="مثلاً موی کوتاه" /></label>
          <label className={styles.field}><span>توضیحات (اختیاری)<small>{description.length.toLocaleString('fa-IR')} / ۲۰۰</small></span><textarea value={description} maxLength={200} onChange={event => setDescription(event.target.value)} /></label>
          <div className={styles.threeColumns}>
            <label className={styles.field}><span>نوع قیمت</span><select value={priceType} onChange={event => { setPriceType(event.target.value as Variant['priceType']); setError(''); }}><option value="FREE">رایگان</option><option value="STARTS_AT">از</option><option value="FIXED">ثابت</option></select></label>
            <label className={styles.field}><span>قیمت (تومان)</span><input type="text" inputMode="numeric" disabled={priceType === 'FREE'} value={priceType === 'FREE' ? '۰' : price} onChange={event => { setPrice(event.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'variant-price-error' : undefined} />{error && <small id="variant-price-error" className={styles.fieldError} role="alert">{error}</small>}</label>
            <label className={styles.field}><span>مدت زمان</span><select value={duration} onChange={event => setDuration(event.target.value)}>{durations.map(minutes => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}</select></label>
          </div>
          {extraTimes.map((item, index) => <div className={styles.durationRow} key={index}>
            <label className={styles.field}><span className={styles.srOnly}>نوع زمان اضافی {index + 1}</span><select value={item.type} onChange={event => { const value = event.target.value as VariantExtraTime['type']; setExtraTimes(current => current.map((row, i) => i === index ? { ...row, type: value } : row)); }}><option value="PROCESSING">زمان پردازش</option><option value="BLOCKED">زمان مسدودشده</option><option value="EXTRA_SERVICE">زمان خدمت اضافی</option></select></label>
            <label className={styles.field}><span className={styles.srOnly}>مدت زمان اضافی {index + 1}</span><select value={item.minutes} onChange={event => { const value = Number(event.target.value); setExtraTimes(current => current.map((row, i) => i === index ? { ...row, minutes: value } : row)); }}>{durations.map(minutes => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}</select></label>
            <button type="button" className={styles.removeTime} aria-label={`حذف زمان اضافی ${index + 1}`} onClick={() => setExtraTimes(current => current.filter((_, i) => i !== index))}>×</button>
          </div>)}
          <details className={styles.extraTime} style={{ marginTop: 24 }}><summary className={styles.extraTimeTrigger}>＋ افزودن زمان اضافی</summary><div className={styles.extraTimeMenu}>{([['PROCESSING', 'زمان پردازش'], ['BLOCKED', 'زمان مسدودشده'], ['EXTRA_SERVICE', 'زمان خدمت اضافی']] as const).map(([type, label]) => <button type="button" key={type} disabled={extraTimes.length >= 20} onClick={event => { setExtraTimes(current => [...current, { type, minutes: 10 }]); event.currentTarget.closest('details')?.removeAttribute('open'); }}>{label}</button>)}</div></details>
          </div>
          <div hidden={section !== 'settings'}>
            <h3>تنظیمات</h3>
            <label className={`${styles.field} ${styles.skuField}`}><span>کد شناسایی خدمت (SKU)<small>{sku.length.toLocaleString('fa-IR')} / ۲۰</small></span><input value={sku} maxLength={20} onChange={event => setSku(event.target.value)} placeholder="مثلاً ABC-12345" aria-describedby="variant-sku-help" /><small id="variant-sku-help">برای شناسایی این حالت خدمت در گزارش‌ها و خروجی‌ها، یک کد اختصاصی وارد کنید.</small></label>
          </div>
          <div className={styles.variantActions}><button type="button" className={styles.close} onClick={onClose}>انصراف</button><button type="submit" className={styles.save}>ذخیره</button></div>
        </div>
      </div>
    </form>
  </dialog>;
}
