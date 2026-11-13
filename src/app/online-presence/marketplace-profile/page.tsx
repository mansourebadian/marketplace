import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check, MapPin, Search, Star } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import styles from './profile.module.css';
import Dashboard from './profile-dashboard';

export const metadata: Metadata = { title: 'پروفایل در بازار آرینو | آرینو' };

export default async function MarketplaceProfilePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, businessAddress: true, businessLocation: true, updatedAt: true, locations: { orderBy: { createdAt: 'asc' }, take: 1, select: { name: true, address: true } } },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  let details: Record<string, unknown> = {};
  try { const parsed: unknown = JSON.parse(business.businessAddress); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) details = parsed as Record<string, unknown>; } catch { /* Legacy plain-text address. */ }
  if (details.marketplaceSetupComplete === true) {
    const image = Array.isArray(details.venueImages) ? details.venueImages.find((name: unknown): name is string => typeof name === 'string' && /^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/i.test(name)) : undefined;
    const address = [business.locations[0]?.address || (typeof details.address === 'string' ? details.address : business.businessAddress), business.businessLocation].filter(Boolean).join('، ');
    return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/online-presence/marketplace-profile" label="پروفایل در بازار آرینو"><Dashboard businessId={business.id} name={business.locations[0]?.name || business.name} address={address} image={image} updatedAt={business.updatedAt.toISOString()} /></BusinessWorkspace>;
  }

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/online-presence/marketplace-profile" label="پروفایل در بازار آرینو">
    <section className={styles.page} aria-labelledby="profile-title">
      <div className={styles.content}>
        <div className={styles.copy}>
          <h1 id="profile-title">با رزرو آنلاین مشتریان جدید جذب کنید</h1>
          <p>به بازار آنلاین زیبایی و سلامت آرینو بپیوندید</p>
          <ul>
            <li><Check size={19} aria-hidden="true" /> کسب‌وکار خود را در آرینو معرفی کنید</li>
            <li><Check size={19} aria-hidden="true" /> به مشتریان جدیدی که به دنبال خدمات شما هستند دسترسی پیدا کنید</li>
            <li><Check size={19} aria-hidden="true" /> به مشتریان اجازه دهید در هر ساعت از شبانه‌روز آنلاین رزرو کنند</li>
          </ul>
          <div className={styles.actions}><Link className={styles.start} href="/online-presence/marketplace-profile/overview">شروع کنید</Link><a href="/setup#online-presence">بیشتر بدانید</a></div>
        </div>
        <div className={styles.art} aria-hidden="true">
          <div className={styles.phoneBack}><div className={styles.search}><Search size={13} /> جست‌وجوی خدمات</div><div className={styles.map}><MapPin size={25} /><MapPin size={20} /><MapPin size={23} /></div><div className={styles.previewLine} /><div className={styles.previewLineShort} /></div>
          <div className={styles.phoneFront}><div className={styles.photo} /><div className={styles.phoneCopy}><strong>استودیو زیبایی</strong><span className={styles.rating}><Star size={12} fill="currentColor" /> ۴٫۸ <small>(۷۳۴)</small></span><small>خدمات زیبایی و سلامت</small><span className={styles.tag}>پیشنهادی</span><hr /><small>رزرو آسان و آنلاین</small><small>خدمات متنوع برای شما</small><div className={styles.book}>رزرو آنلاین</div></div></div>
        </div>
      </div>
    </section>
  </BusinessWorkspace>;
}
