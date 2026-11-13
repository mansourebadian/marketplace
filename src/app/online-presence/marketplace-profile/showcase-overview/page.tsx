import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import styles from '../essentials-overview/essentials.module.css';
import showcaseStyles from './showcase.module.css';

export const metadata: Metadata = { title: 'معرفی کسب‌وکار | آرینو' };

export default async function ShowcaseOverviewPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <main className={styles.page} dir="rtl">
    <header className={styles.header}>
      <div className={`${styles.progress} ${showcaseStyles.progress}`} aria-label="مرحله دوم انتشار پروفایل"><span /><span /><span /></div>
      <nav className={styles.navigation} aria-label="ناوبری مراحل">
        <div className={styles.actions}>
          <Link className={styles.close} href="/online-presence/marketplace-profile">بستن</Link>
          <Link className={styles.continue} href="/online-presence/marketplace-profile/image-guidelines">ادامه <span aria-hidden="true">←</span></Link>
        </div>
        <Link className={styles.back} href="/online-presence/marketplace-profile/working-hours" aria-label="بازگشت"><ArrowRight size={21} /></Link>
      </nav>
    </header>
    <section className={styles.content} aria-labelledby="showcase-title">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>مرحله ۲</span>
        <h1 id="showcase-title">ویژگی‌های منحصربه‌فرد کسب‌وکارتان را نشان دهید</h1>
        <p>با تصاویر چشم‌نواز و توضیحی که مخصوص کسب‌وکار شماست، به پروفایل خود جان بدهید. ویژگی‌هایی را که محل شما را خاص می‌کنند برجسته کنید تا مشتریان را جذب کنید و روی آن‌ها تأثیر بگذارید.</p>
      </div>
      <svg className={`${styles.illustration} ${showcaseStyles.rocket}`} viewBox="0 0 300 300" role="img" aria-label="تصویر موشک">
        <defs><linearGradient id="rocket-body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9cfff"/><stop offset=".5" stopColor="#a38cf6"/><stop offset="1" stopColor="#e7dfff"/></linearGradient><linearGradient id="rocket-fin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#553afa"/><stop offset="1" stopColor="#f35af0"/></linearGradient></defs>
        <g fill="#eee9ff"><circle cx="120" cy="245" r="28"/><circle cx="150" cy="236" r="34"/><circle cx="179" cy="249" r="26"/><circle cx="145" cy="263" r="28"/></g>
        <path d="M109 144 83 171q-5 5-2 14l9 34q3 12 15 8l28-17zM191 144l26 27q5 5 2 14l-9 34q-3 12-15 8l-28-17z" fill="url(#rocket-fin)"/>
        <path d="M150 34c-13 0-52 39-52 91 0 45 17 76 29 85h46c12-9 29-40 29-85 0-52-39-91-52-91z" fill="url(#rocket-body)"/>
        <circle cx="150" cy="116" r="10" fill="#f4efff"/><rect x="129" y="211" width="42" height="11" rx="5.5" fill="#9982db"/><path d="M150 252c-11-15-13-27 0-27s11 12 0 27z" fill="url(#rocket-fin)"/>
      </svg>
    </section>
  </main>;
}
