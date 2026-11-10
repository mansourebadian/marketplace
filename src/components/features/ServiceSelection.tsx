'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Gift, ImageOff, Plus, Star, UsersRound, X } from 'lucide-react';

type Service = { id: string; name: string; description: string | null; price: number; priceType: string; durationMin: number; categoryId: string; categoryName: string };
type Salon = { name: string; address: string; image: string | null; rating: number | null; reviewsCount: number };

function priceLabel(service: Service) {
  if (service.priceType === 'FREE') return 'رایگان';
  return `${service.priceType === 'STARTS_AT' ? 'از ' : ''}${service.price.toLocaleString('fa-IR')} تومان`;
}

export function ServiceSelection({ salon, services, backHref, closeHref, servicesHref, initialSelected, step, businessId, customerHasPhone }: { customerHasPhone: boolean; businessId: string | null; salon: Salon; services: Service[]; backHref: string; closeHref: string; servicesHref: string; initialSelected: string[]; step: 'services' | 'time' }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [message, setMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [bookingPhone, setBookingPhone] = useState('');
  const groups = Array.from(new Map(services.map((service) => [service.categoryId, service.categoryName])).entries());
  const [activeCategory, setActiveCategory] = useState(groups[0]?.[0]);
  const selectedServices = services.filter((service) => selected.includes(service.id));
  const total = selectedServices.reduce((sum, service) => sum + (service.priceType === 'FREE' ? 0 : service.price), 0);
  const hasStartingPrice = selectedServices.some((service) => service.priceType === 'STARTS_AT');
  const query = new URLSearchParams();
  if (servicesHref.includes('?source=business')) query.set('source', 'business');
  if (selected.length) query.set('services', selected.join(','));
  const selectedHref = `${servicesHref.split('?')[0]}?${query.toString()}`;
  query.set('step', 'time');
  const timeHref = `${servicesHref.split('?')[0]}?${query.toString()}`;
  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setMessage('');
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] pb-12 text-gray-950">
      <nav aria-label="پیمایش رزرو" className="sticky top-0 z-20 border-b border-gray-200 bg-[#f5f5f5]/95 px-4 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[1376px] items-center justify-between">
          <Link href={step === 'time' ? selectedHref : backHref} aria-label="بازگشت" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"><ArrowRight className="h-5 w-5" /></Link>
          <Link href={closeHref} aria-label="بستن" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"><X className="h-5 w-5" /></Link>
        </div>
      </nav>
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,444px)] lg:gap-20">
        <div className="min-w-0">
          <div className="mb-4 flex gap-3 text-sm text-gray-400"><span className={step === 'services' ? 'font-semibold text-gray-900' : ''}>خدمات</span><span>‹</span><span className={step === 'time' ? 'font-semibold text-gray-900' : ''}>زمان</span><span>‹</span><span>تأیید</span></div>
          {step === 'time' ? <DateSelection hasServices={selectedServices.length > 0} servicesHref={selectedHref} businessId={businessId} serviceIds={selectedServices.map(service => service.id).join(',')} chosenSlot={selectedSlot} onSlotChange={setSelectedSlot} /> : <>
          <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-[40px]">انتخاب خدمات</h1>
          {groups.length > 0 && <div className="sticky top-[72px] z-10 -mx-1 flex gap-2 overflow-x-auto bg-[#f5f5f5] px-1 py-2">{groups.map(([id, name]) => <a key={id} href={`#category-${encodeURIComponent(id)}`} onClick={() => setActiveCategory(id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${activeCategory === id ? 'border-black bg-black text-white' : 'border-gray-300 bg-transparent text-gray-900 hover:border-black'}`}>{name}</a>)}</div>}
          {groups.length === 0 && <p className="rounded-2xl bg-white p-6 text-gray-500">هنوز خدماتی برای این سالن ثبت نشده است.</p>}
          {groups.map(([id, name]) => <section key={id} id={`category-${id}`} className="scroll-mt-36 pt-7"><h2 className="mb-4 text-xl font-bold">{name}</h2><div className="space-y-3">{services.filter((service) => service.categoryId === id).map((service) => {
            const isSelected = selected.includes(service.id);
            return <article key={service.id} className="rounded-2xl border border-gray-200 bg-white p-6"><h3 className="font-semibold">{service.name}</h3><p className="mt-1 text-sm text-gray-500">{service.durationMin.toLocaleString('fa-IR')} دقیقه</p>{service.description && <p className="mt-3 text-sm leading-6 text-gray-500">{service.description}</p>}<div className="mt-5 flex items-center justify-between"><span className="font-bold">{priceLabel(service)}</span><button type="button" aria-label={`${isSelected ? 'حذف' : 'افزودن'} ${service.name}`} aria-pressed={isSelected} onClick={() => toggle(service.id)} className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm ${isSelected ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-black'}`}>{isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button></div></article>;
          })}</div></section>)}
          <section className="mt-16"><h2 className="mb-4 text-lg font-bold">گزینه‌های دیگر</h2><div className="space-y-3">{[{ title: 'رزرو گروهی', text: 'برای خودتان و همراهانتان', Icon: UsersRound }, { title: 'ارسال هدیه', text: 'هدیه‌ای برای مراجعه بعدی', Icon: Gift }].map(({ title, text, Icon }) => <button key={title} type="button" onClick={() => setMessage(`امکان ${title} هنوز فعال نشده است.`)} className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 text-right hover:border-gray-400"><span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-gray-500">{text}</span></span><Icon className="h-5 w-5" /></button>)}</div></section>
          </>}
        </div>
        <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 lg:sticky lg:top-24 lg:flex lg:min-h-[min(800px,calc(100vh-120px))] lg:flex-col lg:p-8">
          <div className="flex items-center gap-3 border-b border-gray-200 pb-5"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">{salon.image ? <Image src={salon.image} alt="" width={64} height={64} unoptimized className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-400"><ImageOff className="h-6 w-6" /></div>}</div><div className="min-w-0"><h2 className="truncate font-bold">{salon.name}</h2>{salon.rating !== null && <div className="mt-1 flex items-center gap-1 text-sm"><span className="font-bold">{salon.rating.toLocaleString('fa-IR', { maximumFractionDigits: 1 })}</span><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="text-gray-500">({salon.reviewsCount.toLocaleString('fa-IR')})</span></div>}<p className="mt-1 text-sm text-gray-500">{salon.address}</p></div></div>
          {step === 'time' && selectedSlot !== null && <div className="space-y-2 border-b border-gray-200 py-5 text-sm"><p>{new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedSlot)}</p><p>{new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(selectedSlot)} · {selectedServices.reduce((sum, item) => sum + item.durationMin, 0).toLocaleString('fa-IR')} دقیقه</p></div>}
          <div className="space-y-4 border-b border-gray-200 py-5">{selectedServices.length ? selectedServices.map((service) => <div key={service.id} className="flex justify-between gap-3 text-sm"><div><p className="font-semibold">{service.name}</p><p className="mt-1 text-gray-500">{service.durationMin.toLocaleString('fa-IR')} دقیقه</p>{step === 'services' && <button onClick={() => toggle(service.id)} className="mt-1 text-gray-500 underline">حذف</button>}</div><span className="shrink-0">{priceLabel(service)}</span></div>) : <p className="text-sm text-gray-500">هنوز خدمتی انتخاب نشده است.</p>}</div>
          <div className="flex justify-between py-6 font-bold"><span>مجموع</span><span>{selectedServices.length === 0 ? '۰ تومان' : `${hasStartingPrice ? 'از ' : ''}${total.toLocaleString('fa-IR')} تومان`}</span></div>
          <div className="mt-auto">{message && <p role="status" className="mb-4 text-sm text-gray-600">{message}</p>}<button type="button" disabled={!selectedServices.length || (step === 'time' && selectedSlot === null)} onClick={() => { if (step !== 'time') router.push(timeHref); else if (!customerHasPhone && !bookingPhone) setPhoneOpen(true); else setMessage('مرحله تأیید و ثبت نهایی رزرو هنوز فعال نشده است.'); }} className="w-full rounded-full bg-black px-6 py-3.5 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400">ادامه</button></div>
        </aside>
      </div>
      {phoneOpen && <BookingPhoneDialog onClose={() => setPhoneOpen(false)} onContinue={phone => { setBookingPhone(phone); setPhoneOpen(false); setMessage('شماره موبایل دریافت شد. مرحله تأیید و ثبت نهایی رزرو هنوز فعال نشده است.'); }} />}
    </main>
  );
}

function BookingPhoneDialog({ onClose, onContinue }: { onClose: () => void; onContinue: (phone: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/[\s()-]/g, '');
    const national = digits.startsWith('0') ? digits.slice(1) : digits;
    if (!/^9\d{9}$/.test(national)) { setError(phone.trim() ? 'شماره موبایل معتبر وارد کنید.' : 'وارد کردن شماره موبایل الزامی است.'); return; }
    onContinue('+98' + national);
  }
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="booking-phone-title" aria-describedby="booking-phone-description" className="m-auto w-[min(512px,calc(100%-32px))] rounded-[28px] bg-white p-0 text-gray-950 shadow-2xl backdrop:bg-black/30" dir="rtl">
    <div className="relative p-6 sm:p-12"><button type="button" aria-label="بستن" onClick={onClose} className="absolute left-6 top-6 rounded-full p-1 hover:bg-gray-100"><X size={22} /></button>
      <h2 id="booking-phone-title" className="mt-6 text-2xl font-bold">افزودن شماره موبایل</h2><p id="booking-phone-description" className="mt-2 text-sm text-gray-500">شماره موبایل خود را برای ادامه رزرو وارد کنید.</p>
      <form onSubmit={submit} noValidate className="mt-8"><label htmlFor="booking-phone" className="mb-2 block text-sm font-bold">شماره موبایل</label><div dir="ltr" className="flex gap-2"><span className={`flex h-12 items-center rounded-xl border px-4 text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}>+98</span><input id="booking-phone" type="tel" autoComplete="tel-national" inputMode="tel" autoFocus value={phone} onChange={event => { setPhone(event.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'booking-phone-error' : undefined} className={`h-12 min-w-0 flex-1 rounded-xl border px-4 outline-none focus:ring-2 focus:ring-purple-400 ${error ? 'border-red-500' : 'border-gray-300'}`} /></div>{error && <p id="booking-phone-error" role="alert" className="mt-2 text-sm text-red-600">{error}</p>}<button type="submit" className="mt-7 w-full rounded-full bg-black px-6 py-3.5 font-bold text-white hover:bg-gray-800">ادامه</button></form>
    </div>
  </dialog>;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function DateSelection({ hasServices, servicesHref, businessId, serviceIds, chosenSlot, onSlotChange }: { hasServices: boolean; servicesHref: string; businessId: string | null; serviceIds: string; chosenSlot: number | null; onSlotChange: (slot: number | null) => void }) {
  const today = useSyncExternalStore(subscribeToDate, getToday, getServerDate);
  const [chosenDate, setSelectedDate] = useState('');
  const [chosenStart, setStartDate] = useState('');
  const selectedDate = chosenDate || today;
  const startDate = chosenStart || today;
  const [result, setResult] = useState<{ date: string; slots: number[]; error: string } | null>(null);
  useEffect(() => {
    if (!businessId || !selectedDate || !serviceIds) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ date: selectedDate, services: serviceIds });
    fetch(`/api/business/${encodeURIComponent(businessId)}/availability?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setResult({ date: selectedDate, slots: data.slots, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ date: selectedDate, slots: [], error: error instanceof Error ? error.message : 'دریافت ساعت‌ها انجام نشد.' }); });
    return () => controller.abort();
  }, [businessId, selectedDate, serviceIds]);
  const current = result?.date === selectedDate ? result : null;
  const timeFormat = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tehran' });

  function changeStart(days: number) {
    const date = new Date(`${startDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    setStartDate(localDateKey(date) < today ? today : localDateKey(date));
  }

  const dates = startDate ? Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${startDate}T12:00:00`);
    date.setDate(date.getDate() + index);
    return date;
  }) : [];
  const weekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'short' });
  const day = new Intl.DateTimeFormat('fa-IR', { day: 'numeric' });
  const month = new Intl.DateTimeFormat('fa-IR', { month: 'short' });

  return <section>
    <div className="mb-10 flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold tracking-tight sm:text-[40px]">انتخاب تاریخ و زمان</h1>
      <label className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-800" aria-label="انتخاب تاریخ از تقویم">
        <CalendarDays className="h-5 w-5" aria-hidden="true" />
        <input type="date" min={today} value={selectedDate} onChange={(event) => { if (event.target.value && event.target.value >= today) { setSelectedDate(event.target.value); setStartDate(event.target.value); onSlotChange(null); } }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="انتخاب تاریخ" />
      </label>
    </div>
    {!hasServices ? <p className="rounded-2xl bg-white p-6 text-gray-600">ابتدا <Link href={servicesHref} className="font-semibold text-purple-700 underline">خدمات موردنظر</Link> را انتخاب کنید.</p> : <>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">انتخاب تاریخ</h2><div className="flex gap-1"><button type="button" onClick={() => changeStart(-7)} disabled={!startDate || startDate <= today} aria-label="روزهای قبل" className="rounded-full p-2 hover:bg-gray-200 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => changeStart(7)} disabled={!startDate} aria-label="روزهای بعد" className="rounded-full p-2 hover:bg-gray-200 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button></div></div>
      <div className="flex gap-3 overflow-x-auto pb-2">{dates.map((date) => {
        const key = localDateKey(date);
        return <button type="button" key={key} onClick={() => { setSelectedDate(key); onSlotChange(null); }} aria-pressed={selectedDate === key} className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-sm ${selectedDate === key ? 'border-[#6a4cf4] bg-[#6a4cf4] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}><span>{weekday.format(date)}</span><span className="text-xl font-bold">{day.format(date)}</span><span>{month.format(date)}</span></button>;
      })}</div>
      {!businessId ? <p className="mt-10 text-gray-500">نمایش ساعت‌های این سالن هنوز فعال نشده است.</p> : !current ? <p className="mt-10 text-gray-500" role="status">در حال دریافت ساعت‌های آزاد…</p> : current.error ? <p className="mt-10 text-red-700" role="alert">{current.error}</p> : current.slots.length === 0 ? <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center"><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600"><CalendarDays className="h-7 w-7" /></div><h2 className="text-lg font-bold">در این روز زمانی در دسترس نیست</h2><p className="mt-2 text-sm text-gray-500">روز دیگری را انتخاب کنید یا خدمات انتخاب‌شده را تغییر دهید.</p></div> : <div className="mt-8"><h2 className="mb-4 text-lg font-bold">انتخاب ساعت</h2><div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{current.slots.map(slot => <button type="button" key={slot} aria-pressed={chosenSlot === slot} onClick={() => onSlotChange(slot)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${chosenSlot === slot ? 'border-[#6a4cf4] bg-[#6a4cf4] text-white' : 'border-gray-200 bg-white hover:border-[#6a4cf4]'}`}>{timeFormat.format(slot)}</button>)}</div><p className="mt-4 text-sm text-gray-500">ساعت‌ها بر اساس شیفت و خدمات اعضای تیم و به وقت تهران نمایش داده می‌شوند.</p></div>}
    </>}
  </section>;
}

function subscribeToDate(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}

function getToday() { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const value = (type: string) => parts.find(part => part.type === type)?.value; return `${value('year')}-${value('month')}-${value('day')}`; }
function getServerDate() { return ''; }


