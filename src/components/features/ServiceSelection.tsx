'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { confirmBookingPhoneOtp, requestPhoneOtp, resendPhoneOtp } from '@/actions/phone-auth.actions';
import { createPayAtVenueBooking } from '@/actions/test-booking.actions';
import { latinDigits } from '@/lib/phone';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Gift, ImageOff, Plus, Shuffle, Star, UsersRound, X } from 'lucide-react';

type Service = { id: string; name: string; description: string | null; price: number; priceType: string; durationMin: number; categoryId: string; categoryName: string };
type Salon = { name: string; address: string; image: string | null; rating: number | null; reviewsCount: number };

function priceLabel(service: Service) {
  if (service.priceType === 'FREE') return 'رایگان';
  return `${service.priceType === 'STARTS_AT' ? 'از ' : ''}${service.price.toLocaleString('fa-IR')} تومان`;
}

export function ServiceSelection({ salon, services, backHref, closeHref, servicesHref, initialSelected, step, businessId, customerHasPhone, initialSlot }: { initialSlot: number | null; customerHasPhone: boolean; businessId: string | null; salon: Salon; services: Service[]; backHref: string; closeHref: string; servicesHref: string; initialSelected: string[]; step: 'services' | 'time' }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [message, setMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(initialSlot);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(customerHasPhone);
  const [professionalStep, setProfessionalStep] = useState(Boolean(initialSlot && customerHasPhone));
  const [chosenProfessionals, setChosenProfessionals] = useState<Record<string, { id: string; name: string }>>({});
  const [professionalAvailability, setProfessionalAvailability] = useState<{ valid: boolean; hasTeam: boolean; choices: Record<string, string[]> } | null>(null);
  const [visitStep, setVisitStep] = useState(false);
  const [firstVisit, setFirstVisit] = useState<boolean | null>(null);
  const [reviewStep, setReviewStep] = useState(false);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingPending, setBookingPending] = useState(false);
  const [completedBooking, setCompletedBooking] = useState('');
  const requestId = useRef<string | null>(null);
  const groups = Array.from(new Map(services.map((service) => [service.categoryId, service.categoryName])).entries());
  const [activeCategory, setActiveCategory] = useState(groups[0]?.[0]);
  const selectedServices = useMemo(() => services.filter((service) => selected.includes(service.id)), [services, selected]);
  const total = selectedServices.reduce((sum, service) => sum + (service.priceType === 'FREE' ? 0 : service.price), 0);
  const hasStartingPrice = selectedServices.some((service) => service.priceType === 'STARTS_AT');
  const professionalsChosen = selectedServices.every(service => professionalAvailability?.choices[service.id]?.includes(chosenProfessionals[service.id]?.id));
  const continueDisabled = !selectedServices.length || (step === 'time' && (selectedSlot === null || (visitStep ? firstVisit === null : professionalStep && (!professionalAvailability?.valid || (professionalAvailability.hasTeam && !professionalsChosen)))));
  const query = new URLSearchParams();
  if (servicesHref.includes('?source=business')) query.set('source', 'business');
  if (selected.length) query.set('services', selected.join(','));
  const selectedHref = `${servicesHref.split('?')[0]}?${query.toString()}`;
  query.set('step', 'time');
  const timeHref = `${servicesHref.split('?')[0]}?${query.toString()}`;
  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    requestId.current = null;
    setMessage('');
  }

  async function submitBooking() {
    if (!businessId || selectedSlot === null || firstVisit === null || bookingPending || completedBooking) return;
    setMessage('');
    setBookingPending(true);
    requestId.current ||= crypto.randomUUID();
    try {
      const result = await createPayAtVenueBooking({ businessId, requestId: requestId.current, start: selectedSlot, firstVisit, note: bookingNote, services: selectedServices.map(service => ({ id: service.id, memberKey: chosenProfessionals[service.id]?.id || '__any__' })) });
      if (result.id) setCompletedBooking(result.id);
      else setMessage(result.error || 'ثبت نوبت انجام نشد.');
    } catch { setMessage('ثبت نوبت انجام نشد. دوباره تلاش کنید.'); }
    finally { setBookingPending(false); }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] pb-12 text-gray-950">
      <nav aria-label="پیمایش رزرو" className="sticky top-0 z-20 border-b border-gray-200 bg-[#f5f5f5]/95 px-4 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[1376px] items-center justify-between">
          {step === 'time' && (visitStep || professionalStep) && !completedBooking ? <button type="button" onClick={() => { setMessage(''); if (reviewStep) setReviewStep(false); else if (visitStep) { setVisitStep(false); setProfessionalAvailability(null); } else { setProfessionalStep(false); setProfessionalAvailability(null); } }} aria-label="بازگشت" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"><ArrowRight className="h-5 w-5" /></button> : <Link href={completedBooking ? closeHref : step === 'time' ? selectedHref : backHref} aria-label="بازگشت" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"><ArrowRight className="h-5 w-5" /></Link>}
          <Link href={closeHref} aria-label="بستن" className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50"><X className="h-5 w-5" /></Link>
        </div>
      </nav>
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,444px)] lg:gap-20">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-3 text-sm text-gray-400"><span className={step === 'services' ? 'font-semibold text-gray-900' : ''}>خدمات</span><span>‹</span><span className={step === 'time' && !professionalStep ? 'font-semibold text-gray-900' : ''}>زمان</span><span>‹</span><span className={professionalStep && !visitStep ? 'font-semibold text-gray-900' : ''}>متخصص</span><span>‹</span><span className={visitStep && !reviewStep ? 'font-semibold text-gray-900' : ''}>اطلاعات مراجعه</span><span>‹</span><span className={reviewStep ? 'font-semibold text-gray-900' : ''}>تأیید</span></div>
          {step === 'time' && completedBooking ? <section><h1 className="mb-6 text-3xl font-bold">نوبت ثبت شد</h1><div role="status" className="rounded-2xl border border-gray-200 bg-white p-6 leading-8"><p>نوبت شما ثبت شد. هزینه خدمات را در محل مجموعه پرداخت کنید.</p><p className="mt-3 text-sm text-gray-500">شناسه نوبت: <bdi>{completedBooking}</bdi></p><Link href="/activities" className="mt-4 inline-block font-semibold text-purple-700 underline">مشاهده و مدیریت نوبت‌ها</Link></div></section> : step === 'time' && reviewStep ? <BookingReview note={bookingNote} onNoteChange={value => { setBookingNote(value); requestId.current = null; }} address={salon.address} /> : step === 'time' && visitStep ? <FirstVisitSelection salonName={salon.name} value={firstVisit} onChange={value => { setFirstVisit(value); setMessage(''); requestId.current = null; if (value) setReviewStep(true); }} /> : step === 'time' && professionalStep && selectedSlot !== null && businessId ? <ProfessionalSelection businessId={businessId} slot={selectedSlot} services={selectedServices} location={salon.address} chosen={chosenProfessionals} onAvailability={setProfessionalAvailability} onChoose={(serviceId, professional) => { setChosenProfessionals(current => ({ ...current, [serviceId]: professional })); requestId.current = null; }} onBack={() => { setProfessionalStep(false); setProfessionalAvailability(null); }} /> : step === 'time' ? <DateSelection hasServices={selectedServices.length > 0} servicesHref={selectedHref} businessId={businessId} serviceIds={selectedServices.map(service => service.id).join(',')} chosenSlot={selectedSlot} onSlotChange={slot => { setSelectedSlot(slot); setChosenProfessionals({}); setProfessionalAvailability(null); setFirstVisit(null); setReviewStep(false); requestId.current = null; }} /> : <>
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
          <div className="space-y-4 border-b border-gray-200 py-5">{selectedServices.length ? selectedServices.map((service) => <div key={service.id} className="flex justify-between gap-3 text-sm"><div><p className="font-semibold">{service.name}</p><p className="mt-1 text-gray-500">{service.durationMin.toLocaleString('fa-IR')} دقیقه{chosenProfessionals[service.id] && ` · ${chosenProfessionals[service.id].name}`}</p>{step === 'services' && <button onClick={() => toggle(service.id)} className="mt-1 text-gray-500 underline">حذف</button>}</div><span className="shrink-0">{priceLabel(service)}</span></div>) : <p className="text-sm text-gray-500">هنوز خدمتی انتخاب نشده است.</p>}</div>
          <div className="flex justify-between py-6 font-bold"><span>مجموع</span><span>{selectedServices.length === 0 ? '۰ تومان' : `${hasStartingPrice ? 'از ' : ''}${total.toLocaleString('fa-IR')} تومان`}</span></div>
          <div className="mt-auto">{message && <p role="alert" className="mb-4 text-sm text-red-700">{message}</p>}{completedBooking ? <Link href={closeHref} className="block w-full rounded-full bg-black px-6 py-3.5 text-center font-bold text-white hover:bg-gray-800">بازگشت به مجموعه</Link> : reviewStep ? <><p className="mb-3 text-sm text-gray-500">هزینه خدمات را در محل مجموعه پرداخت می‌کنید.</p><button type="button" disabled={bookingPending} onClick={submitBooking} className="w-full rounded-full bg-black px-6 py-3.5 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400">{bookingPending ? 'در حال ثبت…' : 'تأیید و ثبت نوبت'}</button></> : <button type="button" disabled={continueDisabled} onClick={() => { setMessage(''); if (step !== 'time') router.push(timeHref); else if (!phoneVerified) setPhoneOpen(true); else if (!professionalStep && businessId) setProfessionalStep(true); else if (professionalStep && !visitStep) setVisitStep(true); else if (firstVisit !== null) setReviewStep(true); }} className="w-full rounded-full bg-black px-6 py-3.5 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400">ادامه</button>}</div>
        </aside>
      </div>
      {phoneOpen && <BookingPhoneDialog onClose={() => setPhoneOpen(false)} onVerified={() => { setPhoneVerified(true); setPhoneOpen(false); if (businessId) setProfessionalStep(true); else setMessage('مرحله تأیید و ثبت نهایی رزرو هنوز فعال نشده است.'); router.refresh(); }} callbackUrl={`${timeHref}&slot=${selectedSlot}`} />}
    </main>
  );
}

function BookingReview({ note, onNoteChange, address }: { note: string; onNoteChange: (note: string) => void; address: string }) {
  const [editingNote, setEditingNote] = useState(false);
  const [draft, setDraft] = useState(note);
  return <section>
    <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-[40px]">بررسی و تأیید رزرو</h1>
    <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-gray-300" aria-hidden="true" />
        <div><h2 className="font-semibold">پرداخت کامل آنلاین</h2><p className="mt-1 text-sm text-gray-500">پرداخت آنلاین در حال حاضر فعال نیست.</p></div>
      </div>
      <div className="my-5 border-t border-gray-200" />
      <div className="flex items-start gap-4">
        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-gray-300" aria-hidden="true" />
        <div><h2 className="font-semibold">پرداخت بیعانه</h2><p className="mt-1 text-sm text-gray-500">امکان پرداخت بیعانه در حال حاضر فعال نیست.</p></div>
      </div>
      <div className="my-5 border-t border-gray-200" />
      <label className="flex items-start gap-4">
        <input type="radio" name="payment-method" value="venue" checked readOnly className="mt-0.5 h-5 w-5 shrink-0 accent-black" />
        <span><span className="block font-semibold">پرداخت در محل</span><span className="mt-1 block text-sm text-gray-500">هزینه خدمات را هنگام مراجعه به مجموعه پرداخت کنید.</span></span>
      </label>
    </div>
    <h2 className="mb-4 mt-10 text-lg font-bold">جزئیات بیشتر</h2>
    <div className="space-y-3">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h3 className="font-semibold">سیاست لغو نوبت</h3>
        <p className="mt-2 text-sm leading-7 text-gray-500">لغو آنلاین تا ۲۴ ساعت پیش از نوبت از بخش فعالیت‌ها امکان‌پذیر است. پس از آن برای لغو با مجموعه تماس بگیرید. برای جابه‌جایی نوبت نیز فعلاً با مجموعه هماهنگ کنید.</p>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h3 className="font-semibold">اطلاعات مهم</h3>
        <p className="mt-2 text-sm leading-7">لطفاً پیش از رزرو مطالعه کنید.</p>
        <p className="mt-3 text-sm leading-7 text-gray-500">شرایط اختصاصی این مجموعه هنوز ثبت نشده است. موارد زیر نمونه‌اند؛ برای اطلاع از شرایط واقعی با مجموعه تماس بگیرید.</p>
        <div className="mt-5 space-y-5 text-sm leading-7">
          <p><span className="font-semibold">خدمات رنگ: </span>در این نمونه، برای مراجعه اولِ رنگ، تست حساسیت رایگان حداقل ۴۸ ساعت پیش از نوبت انجام می‌شود. این تست حدود پنج دقیقه زمان می‌برد.</p>
          <p><span className="font-semibold">تأخیر: </span>اگر احتمال می‌دهید دیر برسید، با مجموعه تماس بگیرید تا امکان حفظ نوبت بررسی شود.</p>
          {address && address !== 'آدرس ثبت نشده است' && <p><span className="font-semibold">آدرس مجموعه: </span>{address}</p>}
        </div>
      </section>
    </div>
    <h2 className="mb-4 mt-10 text-lg font-bold">توضیحات یا درخواست‌ها</h2>
    <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
      <p className="font-medium">نکته‌ای هست که بخواهید به مجموعه اطلاع دهید؟</p>
      {editingNote ? <div className="mt-4">
        <label htmlFor="booking-note" className="mb-2 block text-sm font-semibold">توضیحات شما</label>
        <textarea id="booking-note" autoFocus rows={4} maxLength={1000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="توضیحات یا درخواست خود را بنویسید" className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm leading-7 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
        <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => { onNoteChange(draft.trim()); setEditingNote(false); }} className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800">ذخیره توضیحات</button><button type="button" onClick={() => { setDraft(note); setEditingNote(false); }} className="rounded-full border border-gray-300 px-5 py-2 text-sm hover:border-gray-500">انصراف</button></div>
      </div> : <>{note && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">{note}</p>}<button type="button" onClick={() => { setDraft(note); setEditingNote(true); }} className="mt-4 rounded-full border border-gray-300 px-5 py-2 text-sm hover:border-gray-500">{note ? 'ویرایش' : 'افزودن'}</button></>}
      <p className="mt-4 text-xs leading-6 text-gray-500">این توضیحات همراه نوبت برای مجموعه ذخیره می‌شود.</p>
    </section>
  </section>;
}

function FirstVisitSelection({ salonName, value, onChange }: { salonName: string; value: boolean | null; onChange: (value: boolean) => void }) {
  const options = [
    { value: true, title: 'بله', description: 'این اولین مراجعه من است' },
    { value: false, title: 'خیر', description: 'قبلاً مراجعه کرده‌ام' },
  ];
  return <section>
    <h1 id="first-visit-question" className="mb-8 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-[40px]">آیا این اولین مراجعه شما به {salonName} است؟</h1>
    <div role="radiogroup" aria-labelledby="first-visit-question" className="space-y-3">
      {options.map(option => <label key={option.title} className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border bg-white p-6 transition hover:border-gray-400 ${value === option.value ? 'border-purple-600 ring-1 ring-purple-600' : 'border-gray-200'}`}>
        <span><span className="block font-semibold">{option.title}</span><span className="mt-1 block text-sm text-gray-500">{option.description}</span></span>
        <input type="radio" name="firstVisit" checked={value === option.value} onChange={() => onChange(option.value)} className="h-5 w-5 accent-[#6a4cf4]" />
      </label>)}
    </div>
  </section>;
}

function BookingPhoneDialog({ onClose, onVerified, callbackUrl }: { onClose: () => void; onVerified: () => void; callbackUrl: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  useEffect(() => {
    if (!codeSent) return;
    const timer = window.setInterval(() => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [codeSent, resendAt]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const digits = phone.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.includes(digit) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/[\s()-]/g, '');
    const national = digits.startsWith('0') ? digits.slice(1) : digits;
    if (!/^9\d{9}$/.test(national)) { setError(phone.trim() ? 'شماره موبایل معتبر وارد کنید.' : 'وارد کردن شماره موبایل الزامی است.'); return; }
    setPending(true);
    const data = new FormData();
    data.set('phone', national); data.set('dialCode', '+98'); data.set('flow', 'customer'); data.set('callbackUrl', callbackUrl);
    try { const result = await requestPhoneOtp(data); if (result.sent) { setError(''); setCodeSent(true); setRemaining(60); setResendAt(Date.now() + 60_000); } else setError(result.error || 'ارسال کد انجام نشد.'); } catch { setError('ارسال کد انجام نشد. دوباره تلاش کنید.'); } finally { setPending(false); }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const data = new FormData();
    data.set('code', code);
    try { const result = await confirmBookingPhoneOtp(data); if (result.verified) onVerified(); else setError(result.error || 'تأیید کد انجام نشد.'); } catch { setError('تأیید کد انجام نشد. دوباره تلاش کنید.'); } finally { setPending(false); }
  }
  async function resend() {
    setError('');
    setPending(true);
    try { const result = await resendPhoneOtp(); if (result.sent) { setCode(''); setRemaining(60); setResendAt(Date.now() + 60_000); } else setError(result.error || 'ارسال کد انجام نشد.'); } catch { setError('ارسال کد انجام نشد. دوباره تلاش کنید.'); } finally { setPending(false); }
  }
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="booking-phone-title" aria-describedby="booking-phone-description" className="m-auto w-[min(512px,calc(100%-32px))] rounded-[28px] bg-white p-0 text-gray-950 shadow-2xl backdrop:bg-black/30" dir="rtl">
    <div className="relative p-6 sm:p-12"><button type="button" aria-label="بستن" onClick={onClose} className="absolute left-6 top-6 rounded-full p-1 hover:bg-gray-100"><X size={22} /></button>
      <h2 id="booking-phone-title" className="mt-6 text-2xl font-bold">{codeSent ? 'تأیید شماره موبایل' : 'افزودن شماره موبایل'}</h2><p id="booking-phone-description" className="mt-2 text-sm text-gray-500">{codeSent ? <>کد شش‌رقمی ارسال‌شده به <bdi dir="ltr">{phone}</bdi> را وارد کنید.</> : 'شماره موبایل خود را برای ادامه رزرو وارد کنید.'}</p>
      {codeSent ? <form onSubmit={verify} noValidate className="mt-8"><label htmlFor="booking-code" className="mb-2 block text-sm font-bold">کد تأیید</label><input id="booking-code" dir="ltr" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={event => { setCode(latinDigits(event.target.value).replace(/\D/g, '').slice(0, 6)); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'booking-code-error' : undefined} className="h-12 w-full rounded-xl border border-gray-300 px-4 text-center text-xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-purple-400" />{error && <p id="booking-code-error" role="alert" className="mt-2 text-sm text-red-600">{error}</p>}<button type="submit" disabled={pending || code.length !== 6} className="mt-7 w-full rounded-full bg-black px-6 py-3.5 font-bold text-white hover:bg-gray-800 disabled:bg-gray-400">{pending ? 'در حال تأیید…' : 'تأیید و ادامه'}</button><div className="mt-4 flex flex-wrap justify-between gap-3 text-sm"><button type="button" disabled={pending} onClick={() => { setCodeSent(false); setCode(''); setError(''); }} className="text-purple-700 disabled:text-gray-400">ویرایش شماره</button><button type="button" disabled={pending || remaining > 0} onClick={resend} className="text-purple-700 disabled:text-gray-400">{remaining > 0 ? `ارسال مجدد تا ${remaining.toLocaleString('fa-IR')} ثانیه دیگر` : 'ارسال مجدد کد'}</button></div></form> :
      <form onSubmit={submit} noValidate className="mt-8"><label htmlFor="booking-phone" className="mb-2 block text-sm font-bold">شماره موبایل</label><div dir="ltr" className="flex gap-2"><span className={`flex h-12 items-center rounded-xl border px-4 text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}>+98</span><input id="booking-phone" type="tel" autoComplete="tel-national" inputMode="tel" autoFocus value={phone} onChange={event => { setPhone(event.target.value); setError(''); }} aria-invalid={!!error} aria-describedby={error ? 'booking-phone-error' : undefined} className={`h-12 min-w-0 flex-1 rounded-xl border px-4 outline-none focus:ring-2 focus:ring-purple-400 ${error ? 'border-red-500' : 'border-gray-300'}`} /></div>{error && <p id="booking-phone-error" role="alert" className="mt-2 text-sm text-red-600">{error}</p>}<button type="submit" disabled={pending} className="mt-7 w-full rounded-full bg-black px-6 py-3.5 font-bold text-white hover:bg-gray-800 disabled:bg-gray-400">{pending ? 'در حال ارسال…' : 'ادامه'}</button></form>}
    </div>
  </dialog>;
}


type Professional = { id: string; name: string; jobTitle: string | null; image: string | null; serviceIds: string[]; working: { start: number; end: number }[]; busy: { start: number; end: number }[] };
type ProfessionalChoice = { id: string; name: string };

function ProfessionalAvatar({ name, image, large = false }: { name: string; image: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('');
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-purple-100 bg-purple-50 font-semibold text-purple-700 ${large ? 'h-36 w-36 text-4xl sm:h-48 sm:w-48' : 'h-16 w-16 text-lg sm:h-20 sm:w-20'}`}>
    {image && !failed ? <Image src={image} alt="" width={192} height={192} unoptimized onError={() => setFailed(true)} className="h-full w-full object-cover" /> : initials || <UsersRound className="h-7 w-7" />}
  </span>;
}

function availableProfessionals(professionals: Professional[], service: Service, start: number) {
  const end = start + service.durationMin * 60_000;
  return professionals.filter(person => person.serviceIds.includes(service.id) && person.working.some(period => period.start <= start && period.end >= end) && !person.busy.some(period => period.start < end && period.end > start));
}

function ProfessionalSelection({ businessId, slot, services, location, chosen, onChoose, onAvailability, onBack }: { businessId: string; slot: number; services: Service[]; location: string; chosen: Record<string, ProfessionalChoice>; onChoose: (serviceId: string, professional: ProfessionalChoice) => void; onAvailability: (availability: { valid: boolean; hasTeam: boolean; choices: Record<string, string[]> } | null) => void; onBack: () => void }) {
  const [data, setData] = useState<{ slots: number[]; professionals: Professional[]; hasTeam: boolean } | null>(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Professional | null>(null);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(slot);
  const ids = services.map(service => service.id).join(',');
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ date, services: ids });
    fetch(`/api/business/${encodeURIComponent(businessId)}/availability?${params}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const result: { slots: number[]; professionals: Professional[]; hasTeam: boolean; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error);
      let start = slot;
      const choices: Record<string, string[]> = {};
      for (const service of services) {
        const available = availableProfessionals(result.professionals, service, start);
        choices[service.id] = [...available.map(person => person.id), ...(available.length > 1 ? ['__any__'] : [])];
        start += service.durationMin * 60_000;
      }
      setData(result);
      onAvailability({ valid: result.slots.includes(slot), hasTeam: result.hasTeam, choices });
    }).catch(reason => { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : 'دریافت متخصصان انجام نشد.'); onAvailability(null); } });
    return () => controller.abort();
  }, [businessId, date, ids, onAvailability, services, slot]);
  let cursor = slot;
  return <section><button type="button" onClick={onBack} className="mb-5 text-sm underline">بازگشت به انتخاب زمان</button><h1 className="mb-8 text-3xl font-bold">انتخاب متخصص</h1>
    {error ? <p role="alert" className="text-red-700">{error}</p> : !data ? <p role="status">در حال دریافت متخصصان…</p> : !data.slots.includes(slot) ? <p role="alert">این زمان دیگر در دسترس نیست؛ زمان دیگری انتخاب کنید.</p> : !data.hasTeam ? <p>برای این مجموعه عضوی از تیم ثبت نشده است.</p> : services.map(service => {
      const start = cursor; cursor += service.durationMin * 60_000;
      const available = availableProfessionals(data.professionals, service, start);
      return <div key={service.id} className="mb-8">
        <h2 className="mb-3 text-lg font-bold">{service.name}</h2>
        <div className="space-y-3">
          {available.length > 1 && <button type="button" aria-pressed={chosen[service.id]?.id === '__any__'} onClick={() => onChoose(service.id, { id: '__any__', name: 'هر متخصص' })} className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-5 text-right transition hover:border-gray-400 ${chosen[service.id]?.id === '__any__' ? 'border-purple-600 ring-1 ring-purple-600' : 'border-gray-200'}`}>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600 sm:h-20 sm:w-20"><Shuffle className="h-7 w-7" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">هر متخصص</span><span className="mt-1 block text-sm text-gray-500">انتخاب از میان متخصصان در دسترس</span></span>
            <span className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm shadow-sm">{chosen[service.id]?.id === '__any__' ? 'انتخاب شد' : 'انتخاب'}</span>
          </button>}
          {available.map(person => <article key={person.id} className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-5 text-right transition ${chosen[service.id]?.id === person.id ? 'border-purple-600 ring-1 ring-purple-600' : 'border-gray-200'}`}>
            <ProfessionalAvatar name={person.name} image={person.image} />
            <div className="min-w-0 flex-1"><p className="font-semibold">{person.name}</p><p className="mt-1 text-sm text-gray-500">{person.jobTitle || `متخصص ${service.name}`}</p><button type="button" onClick={() => setProfile(person)} className="mt-2 text-sm underline underline-offset-4 hover:text-purple-700" aria-label={`مشاهده پروفایل ${person.name}`}>مشاهده پروفایل</button><p className="mt-2 text-sm font-semibold">{priceLabel(service)}</p></div>
            <button type="button" aria-pressed={chosen[service.id]?.id === person.id} onClick={() => onChoose(service.id, { id: person.id, name: person.name })} className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-sm shadow-sm hover:border-gray-400">{chosen[service.id]?.id === person.id ? 'انتخاب شد' : 'انتخاب'}</button>
          </article>)}
        </div>
        {!available.length && <p>متخصصی برای این خدمت در این زمان در دسترس نیست.</p>}
      </div>;
    })}
    {profile && <ProfessionalProfileDialog key={profile.id} person={profile} location={location} services={services.filter(service => profile.serviceIds.includes(service.id))} onClose={() => setProfile(null)} />}
  </section>;
}

type ProfileSection = 'profile' | 'portfolio' | 'reviews';

function ProfessionalProfileDialog({ person, location, services, onClose }: { person: Professional; location: string; services: Service[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const sections = useRef<Partial<Record<ProfileSection, HTMLElement>>>({});
  const [activeSection, setActiveSection] = useState<ProfileSection>('profile');
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);

  const navigation: { id: ProfileSection; label: string }[] = [
    { id: 'profile', label: 'پروفایل' },
    { id: 'portfolio', label: 'نمونه‌کارها' },
    { id: 'reviews', label: 'نظرات' },
  ];

  function goToSection(id: ProfileSection) {
    const container = content.current;
    const target = sections.current[id];
    if (!container || !target) return;
    setActiveSection(id);
    container.scrollTo({ top: container.scrollTop + target.getBoundingClientRect().top - container.getBoundingClientRect().top - 72, behavior: 'smooth' });
  }

  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} aria-labelledby="professional-profile-name" className="m-auto max-h-[min(890px,calc(100dvh-32px))] w-[min(720px,calc(100%-32px))] overflow-hidden rounded-[28px] bg-white p-0 text-gray-950 shadow-2xl backdrop:bg-black/30" dir="rtl">
    <div className="flex items-center justify-between px-6 py-4 sm:px-12">
      <span className="text-sm font-semibold text-gray-500">پروفایل متخصص</span>
      <button type="button" autoFocus onClick={onClose} aria-label="بستن پروفایل" className="rounded-full p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
    </div>
    <div ref={content} className="max-h-[calc(min(890px,100dvh-32px)-68px)] overflow-y-auto overscroll-contain">
      <div className="flex flex-col items-center bg-[#fafafa] px-6 pb-10 pt-2 text-center">
        <ProfessionalAvatar name={person.name} image={person.image} large />
        <h2 id="professional-profile-name" className="mt-4 text-2xl font-bold">{person.name}</h2>
        {person.jobTitle && <p className="mt-2 text-gray-600">{person.jobTitle}</p>}
        {location && location !== 'آدرس ثبت نشده است' && <p className="mt-2 text-sm text-gray-500">{location}</p>}
      </div>
      <div className="px-6 pb-12 sm:px-12">
        <nav aria-label="بخش‌های پروفایل متخصص" className="sticky top-0 z-10 -mx-6 flex gap-2 overflow-x-auto bg-white px-6 py-6 sm:-mx-12 sm:px-12">
          {navigation.map(item => <button key={item.id} type="button" aria-current={activeSection === item.id ? 'location' : undefined} onClick={() => goToSection(item.id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${activeSection === item.id ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-gray-400'}`}>{item.label}</button>)}
        </nav>
        <section ref={element => { if (element) sections.current.profile = element; }} className="pb-12">
          <h3 className="text-lg font-bold">پروفایل</h3>
          {person.jobTitle && <p className="mt-4 text-sm text-gray-600">{person.jobTitle}</p>}
          <h4 className="mt-6 font-semibold">خدمات انتخاب‌شده این متخصص</h4>
          {services.length ? <div className="mt-3 flex flex-wrap gap-2">{services.map(service => <span key={service.id} className="rounded-full bg-gray-100 px-4 py-2 text-sm">{service.name}</span>)}</div> : <p className="mt-3 text-sm text-gray-500">اطلاعات خدمات در دسترس نیست.</p>}
        </section>
        <section ref={element => { if (element) sections.current.portfolio = element; }} className="border-t border-gray-100 py-12">
          <h3 className="text-lg font-bold">نمونه‌کارها</h3>
          <p className="mt-5 text-sm leading-7 text-gray-500">نمایش نمونه‌کارهای این متخصص در حال حاضر در دسترس نیست.</p>
        </section>
        <section ref={element => { if (element) sections.current.reviews = element; }} className="min-h-40 border-t border-gray-100 py-12">
          <h3 className="text-lg font-bold">نظرات</h3>
          <p className="mt-5 text-sm leading-7 text-gray-500">نمایش نظرات این متخصص در حال حاضر در دسترس نیست.</p>
        </section>
      </div>
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


