import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import styles from '../../essentials-overview/essentials.module.css';
import overview from './overview.module.css';

export const metadata: Metadata = { title: 'رزرو آنلاین | آرینو' };

export default async function OnlineBookingsOverviewPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <main className={styles.page} dir="rtl">
    <header className={styles.header}>
      <div className={`${styles.progress} ${overview.progress}`} aria-label="مرحله سوم انتشار پروفایل"><span /><span /><span /></div>
      <nav className={styles.navigation} aria-label="ناوبری مراحل">
        <Link className={styles.back} href="/online-presence/marketplace-profile/about" aria-label="بازگشت"><ArrowRight size={21} /></Link>
        <div className={styles.actions}>
          <Link className={styles.close} href="/online-presence/marketplace-profile">بستن</Link>
          <Link className={styles.continue} href="/online-presence/marketplace-profile/online-bookings/enable-free">ادامه <span aria-hidden="true">←</span></Link>
        </div>
      </nav>
    </header>
    <section className={styles.content} aria-labelledby="bookings-title">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>مرحله ۳</span>
        <h1 id="bookings-title">رزرو آنلاین را در بازار آرینو بپذیرید</h1>
        <p>با تکمیل پروفایل، می‌توانید دریافت رزروهای آنلاین را به‌صورت مستقیم و از طریق بازار آرینو آغاز کنید.</p>
      </div>
      <svg className={`${styles.illustration} ${overview.calendar}`} viewBox="0 0 300 300" role="img" aria-label="تصویر تقویم رزرو">
        <defs>
          <linearGradient id="calendar-top" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#5440f5"/><stop offset=".65" stopColor="#7143ff"/><stop offset="1" stopColor="#e254f5"/></linearGradient>
          <linearGradient id="calendar-body" x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#a797f9"/><stop offset=".55" stopColor="#e4d8ff"/><stop offset="1" stopColor="#fbf9ff"/></linearGradient>
          <linearGradient id="calendar-ring" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e2d9ff"/><stop offset="1" stopColor="#a591f7"/></linearGradient>
        </defs>
        <rect x="55" y="67" width="190" height="188" rx="24" fill="url(#calendar-top)"/>
        <rect x="55" y="111" width="190" height="144" rx="24" fill="url(#calendar-body)"/>
        <rect x="95" y="47" width="32" height="47" rx="16" fill="url(#calendar-ring)"/>
        <rect x="173" y="47" width="32" height="47" rx="16" fill="url(#calendar-ring)"/>
        <path d="m113 175 23 23 52-51" fill="none" stroke="#f1eaff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </section>
  </main>;
}
