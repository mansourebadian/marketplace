'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveDescription } from './about/save-description';
import Link from 'next/link';
import { ImageIcon, Search, UserRoundPlus, X } from 'lucide-react';
import { imageUrl } from '@/lib/image-server';
import styles from './profile-dashboard.module.css';

export default function Dashboard({ businessId, name, address, image, updatedAt }: { businessId: string; name: string; address: string; image?: string; updatedAt: string }) {
  const router = useRouter();
  const [profileError, setProfileError] = useState('');
  const [openingProfile, setOpeningProfile] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [tab, setTab] = useState<'profiles' | 'portfolio'>('profiles');
  const [query, setQuery] = useState('');
  async function openProfile() {
    setOpeningProfile(true);
    setProfileError('');
    let draft: string | null = null;
    try { draft = localStorage.getItem(`marketplace-description-${businessId}`); } catch { /* No local draft is available. */ }
    if (draft?.trim()) {
      const result = await saveDescription(draft, true);
      if (result.error) { setProfileError(result.error); setOpeningProfile(false); return; }
    }
    router.push(`/salon/${encodeURIComponent(businessId)}?source=business`);
  }
  const visible = `${name} ${address}`.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa'));
  return <section className={styles.page} dir="rtl">
    <div className={styles.content}>
      <header className={styles.heading}><div><h1>پروفایل در بازار آرینو</h1><p>پروفایل کسب‌وکار خود را مشاهده و مدیریت کنید.</p></div></header>
      {showBanner && <div className={styles.banner}><button type="button" className={styles.dismiss} aria-label="بستن پیام" onClick={() => setShowBanner(false)}><X size={19} /></button><div><h2>مشتریان خود را بهتر بشناسید</h2><p>پروفایل خود را کامل کنید تا اطلاعات کسب‌وکار شما برای مشتریان آماده باشد.</p><Link href="/online-presence/marketplace-profile/essentials">مدیریت اطلاعات ←</Link></div><div className={styles.bannerArt} aria-hidden="true"><UserRoundPlus size={50} strokeWidth={1.2} /></div></div>}
      <div className={styles.stats}>{['مشتریان جدید', 'ارزش نوبت‌ها', 'بازده بازار'].map(title => <div className={styles.stat} key={title}><strong>{title}</strong><span>—</span></div>)}</div>
      <p className={styles.note}>آمار بازار پس از فراهم شدن اطلاعات رزرو در این بخش نمایش داده می‌شود.</p>
      <div className={styles.tabs}><button type="button" aria-pressed={tab === 'profiles'} className={tab === 'profiles' ? styles.activeTab : ''} onClick={() => setTab('profiles')}>پروفایل‌ها <span>۱</span></button><button type="button" aria-pressed={tab === 'portfolio'} className={tab === 'portfolio' ? styles.activeTab : ''} onClick={() => setTab('portfolio')}>نمونه‌کارها <span>۰</span></button></div>
      {tab === 'profiles' ? <><label className={styles.search}><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجو" aria-label="جست‌وجوی پروفایل" /></label>
        {visible ? <article className={styles.card}>
          <div className={styles.cover}>{image ? (
            // The image server URL is configured separately from the app.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl(image)} alt={`تصویر ${name}`} />
          ) : <ImageIcon size={35} aria-hidden="true" />}</div>
          <div className={styles.cardBody}><div className={styles.cardHeading}><h2>{name}</h2><span className={styles.status}>آماده‌سازی تکمیل شده</span></div><p>هنوز نظری ثبت نشده است</p><p>{address || 'نشانی ثبت نشده است'}</p><div className={styles.cardFooter}><div className={styles.cardLinks}><Link href="/online-presence/marketplace-profile/essentials">مدیریت</Link><button type="button" disabled={openingProfile} onClick={openProfile}>پروفایل</button></div><time dateTime={updatedAt}>به‌روزرسانی: {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' }).format(new Date(updatedAt))}</time></div></div>
        {profileError && <p role="alert">{profileError}</p>}</article> : <p className={styles.empty}>پروفایلی با این عبارت پیدا نشد.</p>}</> : <p className={styles.empty}>هنوز نمونه‌کاری ثبت نشده است.</p>}
    </div>
  </section>;
}
