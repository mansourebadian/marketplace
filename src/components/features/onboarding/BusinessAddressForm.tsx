'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin, X } from 'lucide-react';
import { saveBusinessLocation, type OnboardingServiceLocationState } from '@/actions/onboarding.actions';
import { VenueMap, type Point } from './VenueMap';
import { useEffect, useRef } from 'react';
import { CITIES } from '@/lib/cities';

type Details = { address: string; unit: string; district: string; postalCode: string; directions: string; point?: Point; province?: string; country?: string };
const empty: Details = { address: '', unit: '', district: '', postalCode: '', directions: '' };

export function BusinessAddressForm({ initialLocation, initialAddress, backHref, targetLocation = false }: { initialLocation: string; initialAddress: string; backHref: string; targetLocation?: boolean }) {
  const [city, setCity] = useState(initialLocation);
  const [query, setQuery] = useState(initialLocation);
  const [details, setDetails] = useState<Details>(() => { try { return { ...empty, ...JSON.parse(initialAddress || '{}') }; } catch { return empty; } });
  const [mapMessage, setMapMessage] = useState('');
  const requestId = useRef(0);
  const [draft, setDraft] = useState<Details>(empty);
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<OnboardingServiceLocationState, FormData>(saveBusinessLocation, { status: 'idle' });
  const update = (key: keyof Details, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  async function selectCity(item: string) {
    const id = ++requestId.current;
    setCity(item); setQuery(item); setDetails({ ...empty }); setMapMessage('در حال بارگذاری نقشه…');
    try {
      const response = await fetch('/api/geocode?city=' + encodeURIComponent(item));
      const result = await response.json();
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error();
      setDetails({ ...empty, ...result.details, point: result.point });
      setMapMessage('');
    } catch { if (id === requestId.current) setMapMessage('نقشه شهر بارگذاری نشد. دوباره شهر را انتخاب کنید.'); }
  }
  async function selectPoint(point: Point) {
    const id = ++requestId.current;
    setDetails(current => ({ ...current, point }));
    setMapMessage('در حال دریافت آدرس تقریبی…');
    try {
      const response = await fetch('/api/geocode?lat=' + point.lat + '&lng=' + point.lng);
      const result = await response.json();
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error();
      setDetails(current => ({ ...current, ...result.details, point }));
      setMapMessage('آدرس تقریبی دریافت شد؛ می‌توانید آن را ویرایش کنید.');
    } catch { if (id === requestId.current) setMapMessage('آدرس تقریبی دریافت نشد؛ جزئیات را دستی وارد کنید.'); }
  }
  useEffect(() => {
    if (!initialLocation || details.point) return;
    const controller = new AbortController();
    const id = requestId.current;
    fetch('/api/geocode?city=' + encodeURIComponent(initialLocation), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(result => { if (id === requestId.current) setDetails(current => ({ ...current, point: result.point })); })
      .catch(() => { if (!controller.signal.aborted && id === requestId.current) setMapMessage('نقشه بارگذاری نشد. شهر را دوباره انتخاب کنید.'); });
    return () => controller.abort();
    // Only resolve older saved addresses without coordinates on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const suggestions = query ? CITIES.filter((item) => item.startsWith(query)).slice(0, 8) : [];
  return <div dir="rtl" className="mx-auto w-full max-w-[1408px] px-5 pb-8 pt-7 sm:px-8"><div aria-label="مرحلهٔ سوم از چهار مرحله" className="mb-4 flex h-1 gap-1"><span className="flex-1 rounded-full bg-[#5b4bff]"/><span className="flex-1 rounded-full bg-[#5b4bff]"/><span className="flex-1 rounded-full bg-[#5b4bff]"/><span className="flex-1 rounded-full bg-neutral-200"/></div>
    <div className="mb-4 flex items-center justify-between"><Link href={backHref} aria-label="بازگشت" className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-300"><ArrowRight className="h-5 w-5" /></Link><div className="flex items-center gap-2"><Link href="/setup/business-setup/locations" className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 px-6">بستن</Link><button form="location-form" type="submit" disabled={pending || !city || !details.point} className="inline-flex h-12 items-center gap-3 rounded-full bg-neutral-950 px-6 font-semibold text-white disabled:opacity-50">{pending ? 'در حال ذخیره…' : 'ادامه'}<ArrowLeft className="h-5 w-5" /></button></div></div>
    <div className="mx-auto max-w-[696px]"><p className="mb-3 text-sm text-neutral-500">راه‌اندازی حساب</p><h1 className="mb-3 text-3xl font-bold sm:text-4xl">موقعیت فیزیکی کسب‌وکار را ثبت کنید</h1><p className="mb-8 text-neutral-500">موقعیت دقیق کسب‌وکار خود را روی نقشه بررسی و جزئیات آدرس را وارد کنید.</p>
      <form id="location-form" action={action}><input type="hidden" name="businessLocation" value={city} /><input type="hidden" name="addressDetails" value={JSON.stringify(details)} /><input type="hidden" name="targetLocation" value={targetLocation ? "true" : "false"} /><label className="mb-2 block text-sm font-semibold">موقعیت کسب‌وکار</label><div className="flex items-center rounded-xl border border-neutral-300 px-4"><MapPin className="h-5 w-5 text-neutral-500" /><input value={query} onChange={(e) => { setQuery(e.target.value); if (e.target.value !== city) { ++requestId.current; setCity(''); setDetails({ ...empty }); } }} className="w-full px-3 py-4 outline-none" /></div>{!city && suggestions.length > 0 && <ul className="relative z-10 rounded-xl border bg-white p-2 shadow-lg">{suggestions.map((item) => <li key={item}><button type="button" onClick={() => selectCity(item)} className="w-full rounded-lg px-4 py-3 text-right hover:bg-neutral-100">{item}</button></li>)}</ul>}
        {city && <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">{details.point && <VenueMap point={details.point} onChange={selectPoint} />}<div className="flex items-center justify-between p-4"><div><p className="font-semibold">{city}</p><p className="text-sm text-neutral-500">{details.address || details.district || details.country || 'ایران'}</p></div><button type="button" onClick={() => { ++requestId.current; setDraft({ ...details }); setEditing(true); }} className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold">ویرایش</button></div></div>}
        <p aria-live="polite" className="mt-3 text-sm text-neutral-500">{mapMessage}</p>{city && details.point && <p className="mt-2 text-sm text-neutral-500">روی نقشه کلیک کنید یا نشانگر را جابه‌جا کنید تا موقعیت دقیق انتخاب شود.</p>}{state.message && <p className="mt-3 text-sm text-red-600">{state.message}</p>}
      </form>
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><div role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl"><div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold">ویرایش موقعیت کسب‌وکار</h2><button type="button" onClick={() => setEditing(false)} aria-label="بستن"><X /></button></div><div className="grid gap-4 sm:grid-cols-2">{(['address', 'unit', 'district', 'postalCode'] as const).map((key) => <Field key={key} label={key === 'address' ? 'آدرس' : key === 'unit' ? 'واحد / پلاک' : key === 'district' ? 'منطقه' : 'کد پستی'} value={draft[key]} onChange={(v) => update(key, v)} />)}<Field label="شهر" value={city} onChange={() => {}} disabled /><Field label="کشور" value={draft.country || 'ایران'} onChange={() => {}} disabled /></div><label className="mt-4 block text-sm font-semibold">راهنمای دسترسی</label><textarea value={draft.directions} onChange={(e) => update('directions', e.target.value)} maxLength={200} className="mt-2 min-h-24 w-full rounded-lg border px-3 py-3" placeholder="جزئیات بیشتری برای پیدا کردن محل وارد کنید" /><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditing(false)} className="rounded-full border px-5 py-2">انصراف</button><button type="button" onClick={() => { setDetails(draft); setEditing(false); }} className="rounded-full bg-neutral-950 px-5 py-2 text-white">ذخیره</button></div></div></div>}
  </div>;
}
function Field({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) { return <div><label className="mb-2 block text-sm font-semibold">{label}</label><input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-lg border px-3 py-3 disabled:bg-neutral-100" /></div>; }


