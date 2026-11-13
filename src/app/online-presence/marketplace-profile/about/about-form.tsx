'use client';

import Link from 'next/link';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import shared from '../essentials-overview/essentials.module.css';
import styles from './about.module.css';

export default function AboutForm({ businessId }: { businessId: string }) {
  const [storageError, setStorageError] = useState(false);
  const storageKey = `marketplace-description-${businessId}`;
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener('storage', notify);
    window.addEventListener('marketplace-description-change', notify);
    return () => { window.removeEventListener('storage', notify); window.removeEventListener('marketplace-description-change', notify); };
  }, []);
  const getSnapshot = useCallback(() => { try { return localStorage.getItem(storageKey) ?? ''; } catch { return ''; } }, [storageKey]);
  const description = useSyncExternalStore(subscribe, getSnapshot, () => '');

  function updateDescription(value: string) {
    try { localStorage.setItem(storageKey, value); window.dispatchEvent(new Event('marketplace-description-change')); setStorageError(false); }
    catch { setStorageError(true); }
  }

  return <main className={shared.page} dir="rtl">
    <header className={`${shared.header} ${styles.header}`}>
      <div className={shared.progress}><span /><span /><span /></div>
      <div className={shared.navigation}>
        <Link className={shared.back} href="/online-presence/marketplace-profile/features" aria-label="بازگشت"><ArrowRight size={20} /></Link>
        <div className={shared.actions}>
          <Link className={shared.close} href="/online-presence/marketplace-profile">ذخیره و خروج</Link>
          {description.trim().length >= 200 && !storageError ? <Link className={shared.continue} href="/online-presence/marketplace-profile/online-bookings/overview">ادامه <ArrowLeft size={20} /></Link> : <button className={shared.continue} type="button" disabled>ادامه <ArrowLeft size={20} /></button>}
        </div>
      </div>
    </header>
    <section className={styles.content}>
      <h1>کمی درباره کسب‌وکار خود بگویید</h1>
      <p className={styles.intro}>در توضیحات خود به جزئیات مهم کسب‌وکارتان اشاره کنید و آنچه شما را متمایز می‌کند به مشتریان معرفی کنید.</p>
      <div className={styles.labelRow}><label htmlFor="venue-description">توضیحات کسب‌وکار</label><span dir="ltr">{description.length}/1200</span></div>
      <textarea id="venue-description" className={styles.textarea} value={description} onChange={event => updateDescription(event.target.value)} maxLength={1200} placeholder="توضیح کوتاهی از کسب‌وکار خود و ویژگی‌های آن بنویسید" />
      <p className={styles.hint}>حداقل ۲۰۰ کاراکتر لازم است.</p>
      <p className={styles.hint}>پیش‌نویس این متن در مرورگر همین دستگاه نگهداری می‌شود.</p>
      {storageError && <p role="alert" className={styles.error}>امکان ذخیرهٔ پیش‌نویس در مرورگر وجود ندارد.</p>}
    </section>
  </main>;
}
