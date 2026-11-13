import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, CircleCheck, CircleX, X } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import shared from '../essentials-overview/essentials.module.css';
import styles from './guidelines.module.css';

export const metadata: Metadata = { title: 'راهنمای تصاویر کسب‌وکار | آرینو' };

export default async function ImageGuidelinesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <main className={shared.page} dir="rtl">
    <header className={shared.header}>
      <div className={`${shared.progress} ${styles.progress}`} aria-label="مرحله دوم انتشار پروفایل"><span /><span /><span /></div>
      <nav className={shared.navigation} aria-label="ناوبری مراحل">
        <div className={shared.actions}><Link className={shared.close} href="/online-presence/marketplace-profile">بستن</Link><Link className={shared.continue} href="/online-presence/marketplace-profile/images">ادامه <span aria-hidden="true">←</span></Link></div>
        <Link href="/online-presence/marketplace-profile/showcase-overview" className={shared.back} aria-label="بازگشت"><ArrowRight size={21} /></Link>
      </nav>
    </header>
    <section className={styles.content} aria-labelledby="guidelines-title">
      <h1 id="guidelines-title">راهنمای تصاویر محل کسب‌وکار</h1>
      <p className={styles.description}>تصاویر باکیفیت که زیبایی، آسایش و حرفه‌ای بودن فضای شما را نشان می‌دهند، بهترین راه برای جلب توجه مشتریان جدید هستند.</p>
      <div className={styles.columns}>
        <section><h2>تصاویر مناسب</h2><div className={`${styles.picture} ${styles.good}`} role="img" aria-label="نمای داخلی روشن و واضح یک سالن زیبایی"><span className={`${styles.badge} ${styles.goodBadge}`}><Check size={20} /></span></div><ul className={styles.list}>{['تصاویر واضح از فضای داخلی محل شما', 'حداقل ۳ تصویر', 'تصاویر با وضوح بالا (۲۷۲۷ × ۱۵۴۵)'].map(item => <li key={item}><CircleCheck size={17} className={styles.green}/>{item}</li>)}</ul></section>
        <section><h2>تصاویر نامناسب</h2><div className={`${styles.picture} ${styles.bad}`} role="img" aria-label="نمای نزدیک از انجام خدمات زیبایی"><span className={`${styles.badge} ${styles.badBadge}`}><X size={20} /></span></div><ul className={styles.list}>{['تصاویر آماده و عمومی', 'لوگو و تصاویر برند', 'تصاویر نزدیک از نمونه‌کار، مانند ناخن یا چشم'].map(item => <li key={item}><CircleX size={17} className={styles.red}/>{item}</li>)}</ul></section>
      </div>
    </section>
  </main>;
}
