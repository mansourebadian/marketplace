'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronDown, MoreVertical } from 'lucide-react';
import { createBusinessService } from '@/actions/business-services.actions';
import { TreatmentTypePicker } from './TreatmentTypePicker';
import { VariantDialog, type Variant } from './VariantDialog';
import { AdvancedPricingDialog, type AdvancedPricing } from './AdvancedPricingDialog';
import styles from './ServiceForm.module.css';

const durations = [
  ...Array.from({ length: 24 }, (_, index) => (index + 1) * 5),
  ...Array.from({ length: 8 }, (_, index) => 135 + index * 15),
  ...Array.from({ length: 8 }, (_, index) => 270 + index * 30),
  ...Array.from({ length: 4 }, (_, index) => 540 + index * 60),
];
const extraTimeTypes = [
  { value: 'PROCESSING', label: 'زمان پردازش', description: 'عضو تیم در این زمان آزاد است. این زمان در مدت نمایش‌داده‌شده به مشتری محاسبه می‌شود.' },
  { value: 'BLOCKED', label: 'زمان مسدودشده', description: 'عضو تیم در این زمان مشغول می‌ماند. این زمان در مدت نمایش‌داده‌شده به مشتری محاسبه نمی‌شود.' },
  { value: 'EXTRA_SERVICE', label: 'زمان خدمت اضافی', description: 'عضو تیم در این زمان مشغول می‌ماند. این زمان در مدت نمایش‌داده‌شده به مشتری محاسبه می‌شود.' },
] as const;
type ExtraTimeType = (typeof extraTimeTypes)[number]['value'];
type ExtraTime = { id: number; type: ExtraTimeType; minutes: number };
type DurationRow = ExtraTime | { id: 'service'; type: 'SERVICE' };

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return [
    hours ? `${hours.toLocaleString('fa-IR')} ساعت` : '',
    remainingMinutes ? `${remainingMinutes.toLocaleString('fa-IR')} دقیقه` : '',
  ].filter(Boolean).join(' و ');
}

export function ServiceForm({ categoryKey, categoryName, locations }: { categoryKey: string; categoryName: string; locations: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createBusinessService, {});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState('FIXED');
  const [priceError, setPriceError] = useState('');
  const [variantOpen, setVariantOpen] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedPricing, setAdvancedPricing] = useState<AdvancedPricing[]>([]);
  const priceRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState('60');
  const [rows, setRows] = useState<DurationRow[]>([{ id: 'service', type: 'SERVICE' }]);
  const [openRowMenu, setOpenRowMenu] = useState<DurationRow['id'] | null>(null);
  const nextExtraTimeId = useRef(0);
  const extraTimeRef = useRef<HTMLDetailsElement>(null);
  const pricingOptionsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (extraTimeRef.current && !extraTimeRef.current.contains(event.target as Node)) extraTimeRef.current.open = false;
      if (pricingOptionsRef.current && !pricingOptionsRef.current.contains(event.target as Node)) pricingOptionsRef.current.open = false;
      if (!(event.target as Element).closest('[data-duration-actions]')) setOpenRowMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && extraTimeRef.current?.open) {
        extraTimeRef.current.open = false;
        extraTimeRef.current.querySelector('summary')?.focus();
      }
      if (event.key === 'Escape' && pricingOptionsRef.current?.open) {
        pricingOptionsRef.current.open = false;
        pricingOptionsRef.current.querySelector('summary')?.focus();
      }
      if (event.key === 'Escape') setOpenRowMenu(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, []);
  const hasExtraTimes = rows.length > 1;
  const totalDuration = Number(duration) + rows.reduce((sum, item) => sum + (item.type === 'SERVICE' ? 0 : item.minutes), 0);
  function moveRow(index: number, direction: -1 | 1) {
    setRows(current => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const updated = [...current];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
    setOpenRowMenu(null);
  }
  function openVariant() {
    if (pricingOptionsRef.current) pricingOptionsRef.current.open = false;
    const normalized = price.trim().replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    if (priceType !== 'FREE' && (!/^\d+$/.test(normalized) || Number(normalized) > 2147483647)) {
      setPriceError(price.trim() ? 'قیمت معتبر وارد کنید.' : 'وارد کردن قیمت الزامی است.');
      priceRef.current?.focus();
      return;
    }
    setPriceError('');
    setVariantOpen(true);
  }
  return <main className={styles.page} dir="rtl">
    <form action={action}>
      <header className={styles.topbar}><span>افزودن خدمت جدید</span><div><Link href="/catalogue/services" className={styles.close}>بستن</Link><button className={styles.save} disabled={pending}>{pending ? 'در حال ذخیره…' : 'ذخیره'}</button></div></header>
      <div className={styles.container}>
        <h1>افزودن خدمت جدید</h1>
        <div className={styles.layout}>
          <nav className={styles.sidebar} aria-label="بخش‌های خدمت"><a href="#details">اطلاعات اصلی</a><a href="#pricing">قیمت و مدت زمان</a></nav>
          <div className={styles.content}>
            <section id="details" className={styles.card}>
              <h2>اطلاعات اصلی</h2>
              <label className={styles.field}><span>نام خدمت <small>{name.length.toLocaleString('fa-IR')} / ۲۵۵</small></span><input name="name" value={name} onChange={event => setName(event.target.value)} maxLength={255} required placeholder="نام خدمت را وارد کنید" /></label>
              <div className={styles.twoColumns}>
                <label className={styles.field}><span>دسته‌بندی فهرست</span><input value={categoryName} readOnly /><input type="hidden" name="categoryKey" value={categoryKey} /><small>این خدمت در دسته‌بندی انتخاب‌شده نمایش داده می‌شود.</small></label>
                <TreatmentTypePicker />
              </div>
              <label className={styles.field}><span>توضیحات <small>(اختیاری) · {description.length.toLocaleString('fa-IR')} / ۱۰۰۰</small></span><textarea name="description" maxLength={1000} value={description} onChange={event => setDescription(event.target.value)} placeholder="توضیح کوتاهی وارد کنید" /></label>
            </section>
            <section id="pricing" className={styles.card}>
              <h2>قیمت و مدت زمان</h2>
              <div className={hasExtraTimes ? styles.twoColumns : styles.threeColumns}>
                <label className={styles.field}><span>نوع قیمت</span><select name="priceType" value={priceType} onChange={event => { setPriceType(event.target.value); setPriceError(''); }}><option value="FREE">رایگان</option><option value="STARTS_AT">از</option><option value="FIXED">ثابت</option></select></label>
                <label className={styles.field}><span>قیمت (تومان)</span><input ref={priceRef} name="price" type="text" inputMode="numeric" required={priceType !== 'FREE'} disabled={priceType === 'FREE'} value={priceType === 'FREE' ? '۰' : price} onChange={event => { setPrice(event.target.value); setPriceError(''); }} placeholder="مثلاً ۳۵۰۰۰۰" aria-invalid={!!priceError} aria-describedby={priceError ? 'service-price-error' : undefined} />{priceError && <small id="service-price-error" className={styles.fieldError} role="alert">{priceError}</small>}</label>
                {!hasExtraTimes && <label className={styles.field}><span>مدت زمان</span><select name="durationMin" value={duration} onChange={event => setDuration(event.target.value)}>{durations.map(minutes => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}</select></label>}
              </div>
              {hasExtraTimes && <div className={styles.durationRows}>
                {rows.map((item, index) => <div className={styles.durationRow} key={item.id}>
                  <label className={styles.field}><span className={index === 0 ? '' : styles.srOnly}>نوع مدت زمان {index === 0 ? '' : index + 1}</span><select value={item.type} disabled={item.type === 'SERVICE'} onChange={event => setRows(current => current.map(row => row.id === item.id && row.type !== 'SERVICE' ? { ...row, type: event.target.value as ExtraTimeType } : row))}>{item.type === 'SERVICE' ? <option value="SERVICE">زمان خدمت</option> : extraTimeTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                  <label className={styles.field}><span className={index === 0 ? '' : styles.srOnly}>مدت زمان {index === 0 ? '' : index + 1}</span><select name={item.type === 'SERVICE' ? 'durationMin' : undefined} value={item.type === 'SERVICE' ? duration : item.minutes} onChange={event => { if (item.type === 'SERVICE') setDuration(event.target.value); else setRows(current => current.map(row => row.id === item.id ? { ...row, minutes: Number(event.target.value) } : row)); }}>{durations.map(minutes => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}</select></label>
                  <div className={styles.rowActions} data-duration-actions>
                    <button type="button" className={styles.rowActionsTrigger} aria-label={`عملیات ردیف ${index + 1}`} aria-expanded={openRowMenu === item.id} onClick={() => setOpenRowMenu(current => current === item.id ? null : item.id)}><MoreVertical size={20} /></button>
                    {openRowMenu === item.id && <div className={styles.rowActionsMenu}>
                      <button type="button" disabled={index === 0} onClick={() => moveRow(index, -1)}><ArrowUp size={17} /> انتقال به بالا</button>
                      <button type="button" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)}><ArrowDown size={17} /> انتقال به پایین</button>
                      <button type="button" className={styles.removeRow} disabled={item.type === 'SERVICE'} onClick={() => { setRows(current => current.filter(row => row.id !== item.id)); setOpenRowMenu(null); }}>حذف</button>
                    </div>}
                  </div>
                </div>)}
                <p className={styles.totalDuration}>مجموع مدت زمان: {formatDuration(totalDuration)}</p>
              </div>}
              <input type="hidden" name="extraTimes" value={JSON.stringify(hasExtraTimes ? rows.map(row => row.type === 'SERVICE' ? { type: row.type } : { type: row.type, minutes: row.minutes }) : [])} />
              <input type="hidden" name="variants" value={JSON.stringify(variants)} />
              <input type="hidden" name="advancedPricing" value={JSON.stringify(advancedPricing)} />
              {advancedPricing.length > 0 && <p className={styles.totalDuration}>قیمت یا مدت زمان اختصاصی برای {advancedPricing.length.toLocaleString('fa-IR')} شعبه تنظیم شده است.</p>}
              {variants.length > 0 && <div className={styles.variantList}><h3>حالت‌های خدمت</h3>{variants.map((variant, index) => <div key={index}><span>{variant.name || `حالت ${Number(index + 1).toLocaleString('fa-IR')}`} · {variant.priceType === 'FREE' ? 'رایگان' : `${variant.priceType === 'STARTS_AT' ? 'از ' : ''}${variant.price.toLocaleString('fa-IR')} تومان`} · {formatDuration(variant.durationMin)}</span><button type="button" onClick={() => setVariants(current => current.filter((_, i) => i !== index))} aria-label={`حذف حالت ${variant.name || index + 1}`}>حذف</button></div>)}</div>}
              <div className={styles.pricingActions}>
              <details ref={extraTimeRef} className={styles.extraTime}>
                <summary className={styles.extraTimeTrigger}><span aria-hidden="true">＋</span> افزودن زمان اضافی</summary>
                <div className={styles.extraTimeMenu} aria-label="انواع زمان اضافی">
                  {extraTimeTypes.map(type => <button type="button" key={type.value} disabled={rows.length > 20} onClick={() => { const id = nextExtraTimeId.current++; setRows(current => [...current, { id, type: type.value, minutes: 10 }]); if (extraTimeRef.current) extraTimeRef.current.open = false; }}><strong>{type.label}</strong><span>{type.description}</span></button>)}
                </div>
              </details>
              <details ref={pricingOptionsRef} className={styles.pricingOptions}>
                <summary className={styles.extraTimeTrigger}>گزینه‌ها <ChevronDown size={16} aria-hidden="true" /></summary>
                <div className={styles.pricingOptionsMenu} aria-label="گزینه‌های قیمت و مدت زمان">
                  <button type="button" disabled={variants.length >= 20} onClick={openVariant}>افزودن حالت خدمت</button>
                  <button type="button" onClick={() => { if (pricingOptionsRef.current) pricingOptionsRef.current.open = false; setAdvancedOpen(true); }}>قیمت‌گذاری و زمان‌بندی پیشرفته</button>
                </div>
              </details>
              </div>
            </section>
            {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
          </div>
        </div>
      </div>
    </form>
    <VariantDialog open={variantOpen} onClose={() => setVariantOpen(false)} onSave={variant => { setVariants(current => [...current, variant]); setVariantOpen(false); }} durations={durations} formatDuration={formatDuration} />
    {advancedOpen && <AdvancedPricingDialog locations={locations} values={advancedPricing} defaultDuration={Number(duration)} defaultPriceType={priceType as 'FREE' | 'STARTS_AT' | 'FIXED'} defaultPrice={price} durations={durations} formatDuration={formatDuration} onClose={() => setAdvancedOpen(false)} onApply={values => { setAdvancedPricing(values); setAdvancedOpen(false); }} />}
  </main>;
}
