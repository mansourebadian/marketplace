import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Star, TrendingUp } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import shared from '../../essentials-overview/essentials.module.css';
import styles from './enable-free.module.css';

export const metadata: Metadata = { title: 'فعال‌سازی رزرو آنلاین | آرینو' };

export default async function EnableFreePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <main className={shared.page} dir="rtl">
    <header className={`${shared.header} ${styles.header}`}>
      <div className={`${shared.progress} ${styles.progress}`} aria-label="مرحله سوم انتشار پروفایل"><span /><span /><span /></div>
      <nav className={shared.navigation} aria-label="ناوبری مراحل">
        <Link className={shared.back} href="/online-presence/marketplace-profile/online-bookings/overview" aria-label="بازگشت"><ArrowRight size={21} /></Link>
        <div className={shared.actions}>
          <Link className={shared.close} href="/online-presence/marketplace-profile">ذخیره و خروج</Link>
          <Link className={shared.continue} href="/online-presence/marketplace-profile/online-bookings/you-are-live" prefetch={false}>فعال‌سازی <Check size={19} /></Link>
        </div>
      </nav>
    </header>
    <section className={styles.content} aria-labelledby="enable-title">
      <h1 id="enable-title">رزرو آنلاین را در بازار آرینو فعال کنید</h1>
      <div className={styles.art} aria-hidden="true">
        <div className={styles.card}>
          <div className={styles.photo} />
          <div className={styles.cardText}>
            <strong>استودیو زیبایی</strong>
            <span className={styles.rating}><Star size={12} fill="currentColor" /> ۴٫۸ <small>نظر مشتریان</small></span>
            <span>خدمات زیبایی و سلامت</span>
            <span>رزرو آسان و آنلاین</span>
          </div>
        </div>
        <span className={styles.book}>رزرو آنلاین</span>
        <div className={styles.growth}><TrendingUp size={20} /><div><strong>+۵۰</strong><span>مشتری جدید</span></div></div>
      </div>
      <p>با فعال‌سازی رزرو آنلاین در آرینو، پروفایل کسب‌وکار شما در بازار آرینو قابل مشاهده می‌شود و مشتریان می‌توانند خدمات شما را مستقیماً رزرو کنند.</p>
    </section>
  </main>;
}
