'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { VenueMap, type Point } from '@/components/features/onboarding/VenueMap';
import { saveLocation } from './save-location';
import styles from './location.module.css';

export type AddressDetails = { address: string; unit: string; district: string; postalCode: string; directions: string; province: string; country: string; point: Point };

export function LocationForm({ city, initialDetails, locationAddress }: { city: string; initialDetails: Partial<AddressDetails>; locationAddress: string }) {
  const [address, setAddress] = useState(locationAddress || initialDetails.address || '');
  const [directions, setDirections] = useState(initialDetails.directions || '');
  const [point, setPoint] = useState<Point | undefined>(initialDetails.point);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (initialDetails.point || !city) return;
    const controller = new AbortController();
    fetch('/api/geocode?city=' + encodeURIComponent(city), { signal: controller.signal }).then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(result => setPoint(current => current || result.point)).catch(() => { if (!controller.signal.aborted) setMessage('موقعیت شهر روی نقشه پیدا نشد.'); });
    return () => controller.abort();
  }, [city, initialDetails.point]);
  return <main className={styles.page} dir="rtl"><form action={saveLocation}>
    <header className={styles.header}><div className={styles.progress} aria-label="مرحله اول انتشار پروفایل"><span /><span /><span /></div><nav className={styles.navigation} aria-label="ناوبری مراحل"><div className={styles.actions}><button className={styles.save} type="submit" name="destination" value="exit">ذخیره و خروج</button><button className={styles.continue} type="submit" name="destination" value="hours">ادامه <span aria-hidden="true">←</span></button><button className={styles.preview} type="button" disabled>پیش‌نمایش</button></div><Link href="/online-presence/marketplace-profile/essentials" className={styles.back} aria-label="بازگشت"><ArrowRight size={21} /></Link></nav></header>
    <section className={styles.content}><h1>کسب‌وکار شما کجا قرار دارد؟</h1><p className={styles.subtitle}>مشتریان شما را کجا پیدا کنند؟ نشانگر را روی موقعیت درست تنظیم کنید.</p><label className={styles.label} htmlFor="address">آدرس محل کسب‌وکار</label><div className={styles.inputWrap}><MapPin size={19} aria-hidden="true"/><input id="address" name="address" value={address} onChange={event => setAddress(event.target.value)} maxLength={300} /></div><input type="hidden" name="point" value={point ? JSON.stringify(point) : ''}/>
      <div className={styles.mapCard}>{point ? <VenueMap point={point} onChange={setPoint} /> : <div className={styles.mapPlaceholder}>{message || (city ? 'در حال بارگذاری نقشه…' : 'برای نمایش نقشه، ابتدا موقعیت کسب‌وکار را ثبت کنید.')}</div>}<div className={styles.addressSummary}><div>{[address, initialDetails.unit, initialDetails.district, city, initialDetails.province, initialDetails.postalCode, initialDetails.country].filter(Boolean).map((item, index) => <p key={index}>{item}</p>)}</div><button type="button" onClick={() => document.getElementById('address')?.focus()}>ویرایش</button></div></div><p className={styles.hint}>برای تنظیم موقعیت، نشانگر را جابه‌جا کنید یا روی نقشه بزنید.</p><label className={styles.label} htmlFor="directions">راهنمای دسترسی <span>(اختیاری)</span></label><p className={styles.hint}>برای پیدا کردن ورودی، راهنمای بیشتری به مشتریان بدهید.</p><textarea id="directions" name="directions" value={directions} onChange={event => setDirections(event.target.value)} maxLength={200} rows={4}/></section>
  </form></main>;
}
