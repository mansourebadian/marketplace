import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import styles from './essentials.module.css';

export const metadata: Metadata = { title: 'اطلاعات کسب‌وکار | آرینو' };

export default async function EssentialsOverviewPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <main className={styles.page} dir="rtl">
    <header className={styles.header}>
      <div className={styles.progress} aria-label="مرحله اول انتشار پروفایل"><span /><span /><span /></div>
      <nav className={styles.navigation} aria-label="ناوبری مراحل">
        <div className={styles.actions}>
          <Link className={styles.close} href="/online-presence/marketplace-profile">بستن</Link>
          <Link className={styles.continue} href="/online-presence/marketplace-profile/essentials">ادامه <span aria-hidden="true">←</span></Link>
        </div>
        <Link className={styles.back} href="/online-presence/marketplace-profile/overview" aria-label="بازگشت"><ArrowRight size={21} /></Link>
      </nav>
    </header>
    <section className={styles.content} aria-labelledby="essentials-title">
      <div className={styles.copy}>
        <span className={styles.eyebrow}>مرحله ۱</span>
        <h1 id="essentials-title">درباره کسب‌وکارتان بگویید</h1>
        <p>اطلاعات اصلی کسب‌وکار خود، از جمله نام، شماره تماس، آدرس ایمیل و موقعیت مکانی را وارد کنید. این اطلاعات به مشتریان کمک می‌کند شما را بهتر بشناسند و در صورت نیاز با شما تماس بگیرند.</p>
      </div>
      <Image className={styles.illustration} src="/images/marketplace-business.svg" alt="تصویر فروشگاه" width={300} height={300} unoptimized />
    </section>
  </main>;
}
