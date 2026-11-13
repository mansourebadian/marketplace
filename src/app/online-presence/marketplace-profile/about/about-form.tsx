'use client';

import Link from 'next/link';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveDescription } from './save-description';
import shared from '../essentials-overview/essentials.module.css';
import styles from './about.module.css';

export default function AboutForm({ businessId, initialDescription }: { businessId: string; initialDescription: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [storageError, setStorageError] = useState(false);
  const storageKey = `marketplace-description-${businessId}`;
  const subscribe = useCallback((notify: () => void) => {
    window.addEventListener('storage', notify);
    window.addEventListener('marketplace-description-change', notify);
    return () => { window.removeEventListener('storage', notify); window.removeEventListener('marketplace-description-change', notify); };
  }, []);
  const getSnapshot = useCallback(() => { try { return localStorage.getItem(storageKey) ?? initialDescription ?? ''; } catch { return initialDescription ?? ''; } }, [storageKey, initialDescription]);
  const description = useSyncExternalStore(subscribe, getSnapshot, () => '');

  function updateDescription(value: string) {
    try { localStorage.setItem(storageKey, value); window.dispatchEvent(new Event('marketplace-description-change')); setStorageError(false); }
    catch { setStorageError(true); }
  }

  async function submit(destination: string) {
    setSaving(true);
    setSaveError('');
    const result = await saveDescription(description);
    if (result.error) { setSaveError(result.error); setSaving(false); return; }
    if (result.unavailable) {
      setSaveError('ذخیره عمومی توضیحات نیاز به به‌روزرسانی پایگاه داده دارد؛ پیش‌نویس در این مرورگر باقی می‌ماند.');
      setSaving(false);
      return;
    }
    try { localStorage.removeItem(storageKey); } catch { /* The server copy is already saved. */ }
    router.push(destination);
  }

  return <main className={shared.page} dir="rtl">
    <header className={`${shared.header} ${styles.header}`}>
      <div className={shared.progress}><span /><span /><span /></div>
      <div className={shared.navigation}>
        <Link className={shared.back} href="/online-presence/marketplace-profile/features" aria-label="بازگشت"><ArrowRight size={20} /></Link>
        <div className={shared.actions}>
          <button type="button" className={shared.close} disabled={saving || storageError} onClick={() => submit('/online-presence/marketplace-profile')}>ذخیره و خروج</button>
          <button className={shared.continue} type="button" disabled={description.trim().length < 200 || saving || storageError} onClick={() => submit('/online-presence/marketplace-profile/online-bookings/overview')}>ادامه <ArrowLeft size={20} /></button>
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
      {saveError && <p role="alert" className={styles.error}>{saveError}</p>}
      {storageError && <p role="alert" className={styles.error}>امکان ذخیرهٔ پیش‌نویس در مرورگر وجود ندارد.</p>}
    </section>
  </main>;
}
