'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Check, ChevronDown, MoreVertical, Plus, Search, X } from 'lucide-react';
import { APPOINTMENT_COLORS } from '@/lib/appointment-colors';
import { allocateBundlePrice } from '@/lib/bundle-pricing';
import { BundleImages } from './BundleImages';
import styles from './BundleForm.module.css';

type Category = { key: string; name: string; color: string };
type Service = { id: string; categoryKey: string; name: string; price: number; priceType: string; durationMin: number };
export type InitialBundle = { id: string; name: string; description: string | null; categoryKey: string; scheduleType: 'sequence' | 'parallel'; priceType: 'services' | 'custom' | 'discount' | 'free'; price: number; discount: number | null; onlineBooking: boolean; availability: 'all' | 'women' | 'men'; serviceIds: string[]; images: { id: string; url: string }[] };
const scheduleOptions = [
  { value: 'sequence', label: 'رزرو به ترتیب' },
  { value: 'parallel', label: 'رزرو هم‌زمان' },
] as const;
const pricingOptions = [
  { value: 'services', label: 'قیمت خدمات' },
  { value: 'custom', label: 'قیمت دلخواه' },
  { value: 'discount', label: 'تخفیف درصدی' },
  { value: 'free', label: 'رایگان' },
] as const;
const availabilityOptions = [
  { value: 'all', label: 'همه جنسیت‌ها' },
  { value: 'women', label: 'فقط بانوان' },
  { value: 'men', label: 'فقط آقایان' },
] as const;
export function BundleForm({ categories, initialCategory, services, initial }: { categories: Category[]; initialCategory: string; services: Service[]; initial?: InitialBundle }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [retainedImageIds, setRetainedImageIds] = useState<string[]>(initial?.images.map(image => image.id) ?? []);
  const [imagesProcessing, setImagesProcessing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, startSaving] = useTransition();
  const [category, setCategory] = useState(initialCategory);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);
  const [schedule, setSchedule] = useState<(typeof scheduleOptions)[number]['value']>(initial?.scheduleType ?? 'sequence');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const scheduleTriggerRef = useRef<HTMLButtonElement>(null);
  const [priceType, setPriceType] = useState<(typeof pricingOptions)[number]['value']>(initial?.priceType ?? 'services');
  const [priceOpen, setPriceOpen] = useState(false);
  const [customPrice, setCustomPrice] = useState(initial?.priceType === 'custom' ? String(initial.price) : '');
  const [discount, setDiscount] = useState(initial?.discount != null ? String(initial.discount) : '');
  const priceRef = useRef<HTMLDivElement>(null);
  const priceTriggerRef = useRef<HTMLButtonElement>(null);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [selected, setSelected] = useState<string[]>(initial?.serviceIds ?? []);
  const [openServiceMenu, setOpenServiceMenu] = useState<string | null>(null);
  const serviceDialogRef = useRef<HTMLDialogElement>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [onlineBooking, setOnlineBooking] = useState(initial?.onlineBooking ?? true);
  const [availability, setAvailability] = useState<(typeof availabilityOptions)[number]['value']>(initial?.availability ?? 'all');
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const availabilityRef = useRef<HTMLDivElement>(null);
  const availabilityTriggerRef = useRef<HTMLButtonElement>(null);
  const selectedServices = selected.flatMap(id => services.filter(service => service.id === id));
  const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const effectivePriceType = total === 0 && (priceType === 'custom' || priceType === 'discount') ? 'services' : priceType;
  const discountValue = discount === '' ? 0 : Math.min(100, Number(discount));
  const retailPrice = effectivePriceType === 'free' ? 0 : effectivePriceType === 'discount' ? Math.round(total * (100 - discountValue) / 100) : total;
  const customValue = customPrice === '' ? null : Number(customPrice);
  const customIsValid = customValue !== null && Number.isSafeInteger(customValue) && customValue <= 2147483647 && total <= 2147483647;
  const customShares = effectivePriceType === 'custom' && customIsValid ? allocateBundlePrice(selectedServices.map(service => service.price), customValue) : null;
  const totalDuration = schedule === 'parallel' ? Math.max(0, ...selectedServices.map(service => service.durationMin)) : selectedServices.reduce((sum, service) => sum + service.durationMin, 0);
  const money = (value: number) => `${value.toLocaleString('fa-IR')} تومان`;
  const selectedCategory = categories.find(item => item.key === category);
  const colorFor = (value: string) => APPOINTMENT_COLORS.find(item => item.value === value)?.hex ?? APPOINTMENT_COLORS[0].hex;
  const serviceQuery = serviceSearch.trim().toLocaleLowerCase('fa');
  const serviceGroups = categories.filter(item => item.key === category).map(item => ({ ...item, services: services.filter(service => service.categoryKey === item.key && service.name.toLocaleLowerCase('fa').includes(serviceQuery)) })).filter(item => item.services.length > 0);
  const servicePrice = (service: Service) => service.priceType === 'FREE' ? 'رایگان' : `${service.priceType === 'STARTS_AT' ? 'از ' : ''}${service.price.toLocaleString('fa-IR')} تومان`;

  function moveService(index: number, direction: -1 | 1) {
    setSelected(current => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setOpenServiceMenu(null);
  }

  useEffect(() => {
    if (!openServiceMenu) return;
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target as Element).closest('[data-bundle-service-menu]')) setOpenServiceMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenServiceMenu(null);
        document.getElementById(`bundle-service-actions-${openServiceMenu}`)?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [openServiceMenu]);

  function saveBundle() {
    setSaveError('');
    if (imagesProcessing) { setSaveError('منتظر پایان پردازش تصاویر بمانید.'); return; }
    if (selectedServices.some(service => service.categoryKey !== category)) { setSaveError('خدمات انتخاب‌شده باید متعلق به دسته‌بندی بسته باشند.'); return; }
    if (effectivePriceType === 'custom' && !customPrice) { setSaveError('قیمت بسته را وارد کنید.'); return; }
    if (effectivePriceType === 'custom' && !customIsValid) { setSaveError('قیمت بسته یا مجموع خدمات بیش از حد مجاز است.'); return; }
    if (effectivePriceType === 'discount' && discount === '') { setSaveError('درصد تخفیف را وارد کنید.'); return; }
    startSaving(async () => {
      try {
        const form = new FormData();
        if (initial) form.set('edit', JSON.stringify({ id: initial.id, retainedImageIds }));
        form.set('bundle', JSON.stringify({ name, categoryKey: category, description, scheduleType: schedule, priceType: effectivePriceType, customPrice: effectivePriceType === 'custom' ? Number(customPrice) : null, discount: effectivePriceType === 'discount' ? Number(discount) : null, onlineBooking, availability, serviceIds: selected }));
        files.forEach(file => form.append('images', file));
        const response = await fetch('/api/catalogue/bundles', { method: 'POST', body: form });
        const result: { error?: string } = await response.json();
        if (!response.ok && !result.error) { setSaveError('ذخیره بسته انجام نشد.'); return; }
        if (result.error) { setSaveError(result.error); return; }
        router.push('/catalogue/services');
        router.refresh();
      } catch { setSaveError('ذخیره بسته انجام نشد. دوباره تلاش کنید.'); }
    });
  }

  useEffect(() => {
    if (!categoryOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!categoryRef.current?.contains(event.target as Node)) setCategoryOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setCategoryOpen(false); categoryTriggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [categoryOpen]);

  useEffect(() => {
    if (!scheduleOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!scheduleRef.current?.contains(event.target as Node)) setScheduleOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setScheduleOpen(false); scheduleTriggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [scheduleOpen]);

  useEffect(() => {
    if (!priceOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!priceRef.current?.contains(event.target as Node)) setPriceOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPriceOpen(false); priceTriggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [priceOpen]);

  useEffect(() => {
    if (!availabilityOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!availabilityRef.current?.contains(event.target as Node)) setAvailabilityOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setAvailabilityOpen(false); availabilityTriggerRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [availabilityOpen]);

  return <div className={styles.page} dir="rtl">
    <header className={styles.topbar}><strong>{initial ? 'ویرایش بسته' : 'بسته جدید'}</strong><div><Link href="/catalogue/services" className={styles.close}>بستن</Link><button className={styles.save} type="button" disabled={saving || imagesProcessing} onClick={saveBundle}>{saving ? 'در حال ذخیره…' : 'ذخیره'}</button></div></header>
    <main className={styles.container}>
      <h1>{initial ? 'ویرایش بسته' : 'بسته جدید'}</h1>
      {saveError && <p className={styles.notice} role="alert">{saveError}</p>}
      <section className={styles.card}>
        <h2>اطلاعات اصلی</h2>
        <label className={styles.field}>نام بسته<input maxLength={255} value={name} onChange={event => setName(event.target.value)} placeholder="نام بسته را وارد کنید" /></label>
        <div className={styles.field} ref={categoryRef}>
          <span id="bundle-category-label">دسته‌بندی</span>
          <div className={styles.categoryDropdown}>
            <button ref={categoryTriggerRef} type="button" className={styles.categoryTrigger} aria-labelledby="bundle-category-label bundle-category-value" aria-expanded={categoryOpen} aria-controls="bundle-category-options" onClick={() => setCategoryOpen(open => !open)}>
              <span className={styles.categoryName}><span className={styles.colorSwatch} style={{ backgroundColor: colorFor(selectedCategory?.color ?? 'blue') }} /><span id="bundle-category-value">{selectedCategory?.name}</span></span><ChevronDown size={18} aria-hidden="true" />
            </button>
            {categoryOpen && <div id="bundle-category-options" className={styles.categoryOptions} role="group" aria-label="انتخاب دسته‌بندی">
              {categories.map(item => <button type="button" key={item.key} className={styles.categoryOption} aria-pressed={category === item.key} onClick={() => { setCategory(item.key); setCategoryOpen(false); categoryTriggerRef.current?.focus(); }}><span className={styles.categoryName}><span className={styles.colorSwatch} style={{ backgroundColor: colorFor(item.color) }} />{item.name}</span>{category === item.key && <Check size={18} aria-hidden="true" />}</button>)}
            </div>}
          </div>
          <small>دسته‌بندی نمایش‌داده‌شده به شما و مشتریان در رزرو آنلاین</small>
        </div>
        <label className={styles.field}><span>توضیحات (اختیاری)<small>{description.length.toLocaleString('fa-IR')} / ۱۰۰۰</small></span><textarea maxLength={1000} value={description} onChange={event => setDescription(event.target.value)} placeholder="توضیحی درباره این بسته بنویسید" /></label>
      </section>
      <section className={styles.card}>
        <h2>خدمات</h2><p className={styles.help}>خدمات این بسته و ترتیب ارائه آن‌ها هنگام رزرو را انتخاب کنید.</p>
        {selectedServices.map((service, index) => <div className={styles.service} key={service.id} style={{ borderInlineStartColor: colorFor(selectedCategory?.color ?? 'blue') }}><div><strong>{service.name}</strong><small>{service.durationMin.toLocaleString('fa-IR')} دقیقه</small></div><div className={styles.serviceEnd}><div className={styles.serviceAmount}>{customShares ? <><span>{money(customShares[index])}</span>{customShares[index] !== service.price && <del>{servicePrice(service)}</del>}</> : <span>{servicePrice(service)}</span>}</div><div className={styles.serviceActions} data-bundle-service-menu><button id={`bundle-service-actions-${service.id}`} type="button" className={styles.serviceActionsTrigger} aria-label={`عملیات ${service.name}`} aria-expanded={openServiceMenu === service.id} onClick={() => setOpenServiceMenu(current => current === service.id ? null : service.id)}><MoreVertical size={19} /></button>{openServiceMenu === service.id && <div className={styles.serviceActionsMenu} aria-label={`عملیات ${service.name}`}>
          <button type="button" disabled={index === 0} onClick={() => moveService(index, -1)}><ArrowUp size={17} /> انتقال به بالا</button>
          <button type="button" disabled={index === selectedServices.length - 1} onClick={() => moveService(index, 1)}><ArrowDown size={17} /> انتقال به پایین</button>
          <button type="button" disabled title="این قابلیت هنوز آماده نیست">افزودن زمان اضافی</button>
          <div className={styles.serviceActionsSeparator} />
          <button type="button" onClick={() => { setSelected(current => current.filter(id => id !== service.id)); if (total - service.price === 0 && (priceType === 'custom' || priceType === 'discount')) setPriceType('services'); setOpenServiceMenu(null); }}>حذف</button>
        </div>}</div></div></div>)}
        <div className={styles.servicesFooter}><button type="button" className={styles.outline} onClick={() => serviceDialogRef.current?.showModal()} aria-haspopup="dialog"><Plus size={18} /> افزودن خدمت</button>
          {selectedServices.length > 0 && <div className={styles.servicesTotal}><span>مدت کل: {totalDuration.toLocaleString('fa-IR')} دقیقه</span><div>{customShares && customValue !== total && <del>{money(total)}</del>}<strong>{money(customShares ? customValue! : retailPrice)}</strong></div></div>}
        </div>
        <div className={styles.field} ref={scheduleRef}>
          <span id="bundle-schedule-label">نوع زمان‌بندی</span>
          <div className={styles.categoryDropdown}>
            <button ref={scheduleTriggerRef} type="button" className={styles.categoryTrigger} aria-labelledby="bundle-schedule-label bundle-schedule-value" aria-expanded={scheduleOpen} aria-controls={scheduleOpen ? 'bundle-schedule-options' : undefined} onClick={() => setScheduleOpen(open => !open)}>
              <span id="bundle-schedule-value">{scheduleOptions.find(item => item.value === schedule)?.label}</span><ChevronDown size={18} aria-hidden="true" />
            </button>
            {scheduleOpen && <div id="bundle-schedule-options" className={styles.categoryOptions} role="group" aria-label="انتخاب نوع زمان‌بندی">
              {scheduleOptions.map(item => <button type="button" key={item.value} className={styles.categoryOption} aria-pressed={schedule === item.value} onClick={() => { setSchedule(item.value); setScheduleOpen(false); scheduleTriggerRef.current?.focus(); }}><span>{item.label}</span>{schedule === item.value && <Check size={18} aria-hidden="true" />}</button>)}
            </div>}
          </div>
          <small>مشخص کنید خدمات به ترتیب یا به‌صورت هم‌زمان ارائه شوند.</small>
        </div>
      </section>
      <section className={styles.card}>
        <h2>قیمت‌گذاری</h2>
        <div className={styles.columns}>
          <div className={styles.field} ref={priceRef}>
            <span id="bundle-price-label">نوع قیمت</span>
            <div className={styles.categoryDropdown}>
              <button ref={priceTriggerRef} type="button" className={styles.categoryTrigger} aria-labelledby="bundle-price-label bundle-price-value" aria-expanded={priceOpen} aria-controls={priceOpen ? 'bundle-price-options' : undefined} onClick={() => setPriceOpen(open => !open)}>
                <span id="bundle-price-value">{pricingOptions.find(item => item.value === effectivePriceType)?.label}</span><ChevronDown size={18} aria-hidden="true" />
              </button>
              {priceOpen && <div id="bundle-price-options" className={styles.categoryOptions} role="group" aria-label="انتخاب نوع قیمت">
                {pricingOptions.map(item => {
                  const unavailable = total === 0 && (item.value === 'custom' || item.value === 'discount');
                  return <button type="button" key={item.value} className={styles.categoryOption} disabled={unavailable} aria-pressed={effectivePriceType === item.value} onClick={() => { if (item.value === 'custom' && customPrice === '') setCustomPrice(String(total)); setPriceType(item.value); setPriceOpen(false); priceTriggerRef.current?.focus(); }}>
                    <span className={styles.priceOptionText}><span>{item.label}</span>{unavailable && <small>خدمات بسته رایگان هستند</small>}</span>{effectivePriceType === item.value && <Check size={18} aria-hidden="true" />}
                  </button>;
                })}
              </div>}
            </div>
          </div>
          <label className={styles.field}>قیمت نهایی
            {effectivePriceType === 'custom' ? <input type="text" inputMode="numeric" value={customPrice} onChange={event => setCustomPrice(event.target.value.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/\D/g, ''))} placeholder="قیمت را به تومان وارد کنید" /> : <input value={`${retailPrice.toLocaleString('fa-IR')} تومان`} readOnly />}
            <small>{effectivePriceType === 'services' ? 'بدون تخفیف' : effectivePriceType === 'free' ? 'بسته رایگان است' : effectivePriceType === 'discount' ? `${discountValue.toLocaleString('fa-IR')}٪ تخفیف` : !customIsValid ? 'قیمت معتبر به تومان وارد کنید' : customValue < total ? `${money(total - customValue)} تخفیف` : customValue > total ? `${money(customValue - total)} بیشتر از مجموع خدمات` : 'بدون تخفیف'}</small>
          </label>
        </div>
        {effectivePriceType === 'discount' && <label className={styles.field}>درصد تخفیف<input type="number" min="0" max="100" step="1" value={discount} onChange={event => setDiscount(event.target.value === '' ? '' : String(Math.min(100, Math.max(0, Number(event.target.value)))))} placeholder="درصد تخفیف را وارد کنید" /></label>}
      </section>
      <section className={styles.card}>
        <div className={styles.bookingHeading}><div><h2>رزرو آنلاین <span className={styles.badge}>{onlineBooking ? 'فعال' : 'غیرفعال'}</span></h2><p className={styles.help}>به مشتریان اجازه دهید این بسته را به‌صورت آنلاین رزرو کنند.</p></div><button type="button" role="switch" aria-checked={onlineBooking} aria-label="رزرو آنلاین" className={`${styles.toggle} ${onlineBooking ? styles.toggleOn : ''}`} onClick={() => { setOnlineBooking(value => !value); setAvailabilityOpen(false); }}><span /></button></div>
        <div className={styles.field} ref={availabilityRef}>
          <span id="bundle-availability-label">قابل ارائه به</span>
          <div className={styles.categoryDropdown}>
            <button ref={availabilityTriggerRef} type="button" className={styles.categoryTrigger} disabled={!onlineBooking} aria-labelledby="bundle-availability-label bundle-availability-value" aria-expanded={availabilityOpen} aria-controls={availabilityOpen ? 'bundle-availability-options' : undefined} onClick={() => setAvailabilityOpen(open => !open)}>
              <span id="bundle-availability-value">{availabilityOptions.find(item => item.value === availability)?.label}</span><ChevronDown size={18} aria-hidden="true" />
            </button>
            {availabilityOpen && <div id="bundle-availability-options" className={styles.categoryOptions} role="group" aria-label="انتخاب مخاطبان بسته">
              {availabilityOptions.map(item => <button type="button" key={item.value} className={styles.categoryOption} aria-pressed={availability === item.value} onClick={() => { setAvailability(item.value); setAvailabilityOpen(false); availabilityTriggerRef.current?.focus(); }}><span>{item.label}</span>{availability === item.value && <Check size={18} aria-hidden="true" />}</button>)}
            </div>}
          </div>
        </div>
      </section>
      <BundleImages initialImages={initial?.images} onFilesChange={setFiles} onRetainedChange={setRetainedImageIds} onProcessingChange={setImagesProcessing} />
    </main>
    <dialog ref={serviceDialogRef} className={styles.serviceDialog} aria-labelledby="bundle-services-title" onClose={() => setServiceSearch('')}>
      <div className={styles.serviceDialogHeader}><h2 id="bundle-services-title">خدمات</h2><button type="button" aria-label="بستن" onClick={() => serviceDialogRef.current?.close()}><X size={22} /></button></div>
      <label className={styles.serviceSearch}><Search size={19} aria-hidden="true" /><input autoFocus value={serviceSearch} onChange={event => setServiceSearch(event.target.value)} placeholder="جست‌وجو بر اساس نام" aria-label="جست‌وجوی نام خدمت" /></label>
      <div className={styles.serviceResults}>
        {serviceGroups.length === 0 ? <p className={styles.noServices}>{serviceQuery ? 'خدمتی با این نام در این دسته‌بندی پیدا نشد.' : 'هنوز خدمتی در این دسته‌بندی ثبت نشده است.'}</p> : serviceGroups.map(group => <section key={group.key} className={styles.serviceGroup}>
          <h3>{group.name}</h3>
          {group.services.map(service => <button type="button" key={service.id} className={styles.serviceChoice} style={{ borderInlineStartColor: colorFor(group.color) }} disabled={selected.includes(service.id)} onClick={() => { setSelected(current => [...current, service.id]); serviceDialogRef.current?.close(); }}>
            <span className={styles.serviceDetails}><strong>{service.name}</strong><small>{service.durationMin.toLocaleString('fa-IR')} دقیقه{selected.includes(service.id) ? ' · افزوده شده' : ''}</small></span><span>{servicePrice(service)}</span>
          </button>)}
        </section>)}
      </div>
    </dialog>
  </div>;
}
