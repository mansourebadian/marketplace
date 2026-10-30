'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, Store } from 'lucide-react';
import styles from './AdvancedPricingDialog.module.css';

type PriceType = 'FIXED' | 'STARTS_AT' | 'FREE';
export type AdvancedPricing = { locationId: string; durationMin: number | null; priceType: PriceType | null; price: number | null };
type Draft = { durationMin: string; priceType: string; price: string };
const typeLabels: Record<PriceType, string> = { FIXED: 'ثابت', STARTS_AT: 'از', FREE: 'رایگان' };

export function AdvancedPricingDialog({ locations, values, defaultDuration, defaultPriceType, defaultPrice, durations, formatDuration, onApply, onClose }: { locations: { id: string; name: string }[]; values: AdvancedPricing[]; defaultDuration: number; defaultPriceType: PriceType; defaultPrice: string; durations: number[]; formatDuration: (minutes: number) => string; onApply: (values: AdvancedPricing[]) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState('');
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Record<string, Draft>>(() => Object.fromEntries(values.map(value => [value.locationId, { durationMin: value.durationMin?.toString() ?? '', priceType: value.priceType ?? '', price: value.price?.toString() ?? '' }])));
  useEffect(() => { dialog.current?.showModal(); }, []);

  function change(id: string, patch: Partial<Draft>) {
    setDraft(current => ({ ...current, [id]: { ...(current[id] ?? { durationMin: '', priceType: '', price: '' }), ...patch } }));
    setError('');
  }
  function apply() {
    const result: AdvancedPricing[] = [];
    for (const location of locations) {
      const item = draft[location.id];
      if (!item || (!item.durationMin && !item.priceType && !item.price.trim())) continue;
      const normalized = item.price.trim().replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
      if (normalized && (!/^\d+$/.test(normalized) || Number(normalized) > 2147483647)) { setError(`قیمت شعبهٔ «${location.name}» معتبر نیست.`); return; }
      result.push({ locationId: location.id, durationMin: item.durationMin ? Number(item.durationMin) : null, priceType: (item.priceType || null) as PriceType | null, price: (item.priceType || defaultPriceType) === 'FREE' ? null : normalized ? Number(normalized) : null });
    }
    onApply(result);
  }
  const visible = locations.filter(location => location.name.toLocaleLowerCase('fa').includes(search.trim().toLocaleLowerCase('fa')) && (!onlyChanged || !!draft[location.id] && Object.values(draft[location.id]).some(Boolean)));

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="advanced-pricing-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className={styles.page} dir="rtl">
      <header className={styles.topbar}><button type="button" onClick={onClose}>بستن</button><button type="button" className={styles.apply} onClick={apply}>اعمال</button></header>
      <main className={styles.container}>
        <h1 id="advanced-pricing-title">قیمت‌گذاری و زمان‌بندی پیشرفته</h1>
        <p className={styles.subtitle}>قیمت و مدت خدمت را برای هر شعبه مشخص کنید.</p>
        <div className={styles.toolbar}><label className={styles.search}><Search size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="جست‌وجو" aria-label="جست‌وجوی شعبه" /></label><button type="button" aria-pressed={onlyChanged} onClick={() => setOnlyChanged(value => !value)}><SlidersHorizontal size={16} /> {onlyChanged ? 'همه شعبه‌ها' : 'فقط تنظیم‌شده‌ها'}</button><button type="button" className={styles.resetAll} onClick={() => setDraft({})}>بازنشانی همه</button></div>
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>شعبه</th><th>مدت زمان<small>پیش‌فرض: {formatDuration(defaultDuration)}</small></th><th>نوع قیمت<small>پیش‌فرض: {typeLabels[defaultPriceType]}</small></th><th>قیمت<small>پیش‌فرض: {defaultPriceType === 'FREE' ? 'رایگان' : `${defaultPrice || '۰'} تومان`}</small></th></tr></thead><tbody>
          {visible.map(location => { const item = draft[location.id] ?? { durationMin: '', priceType: '', price: '' }; const effectiveType = item.priceType || defaultPriceType; return <tr key={location.id}>
            <td><div className={styles.location}><span className={styles.locationIcon}><Store size={19} /></span><div><strong>{location.name}</strong><button type="button" onClick={() => change(location.id, { durationMin: '', priceType: '', price: '' })}>بازنشانی</button></div></div></td>
            <td><select aria-label={`مدت زمان ${location.name}`} value={item.durationMin} onChange={event => change(location.id, { durationMin: event.target.value })}><option value="">{formatDuration(defaultDuration)} (پیش‌فرض)</option>{durations.map(minutes => <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>)}</select></td>
            <td><select aria-label={`نوع قیمت ${location.name}`} value={item.priceType} onChange={event => change(location.id, { priceType: event.target.value, ...(event.target.value === 'FREE' ? { price: '' } : {}) })}><option value="">{typeLabels[defaultPriceType]} (پیش‌فرض)</option><option value="FREE">رایگان</option><option value="STARTS_AT">از</option><option value="FIXED">ثابت</option></select></td>
            <td><input aria-label={`قیمت ${location.name} به تومان`} inputMode="numeric" disabled={effectiveType === 'FREE'} value={effectiveType === 'FREE' ? '' : item.price} onChange={event => change(location.id, { price: event.target.value })} placeholder={effectiveType === 'FREE' ? 'رایگان' : defaultPrice || '۰'} /></td>
          </tr>; })}
        </tbody></table></div>
        {visible.length === 0 && <p className={styles.empty}>{locations.length ? 'شعبه‌ای مطابق جست‌وجو پیدا نشد.' : 'هنوز شعبه‌ای برای این کسب‌وکار ثبت نشده است.'}</p>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </main>
    </div>
  </dialog>;
}
