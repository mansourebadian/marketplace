import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { saveEssentials } from './save-essentials';
import styles from './essentials.module.css';

export const metadata: Metadata = { title: 'اطلاعات اصلی محل کسب‌وکار | آرینو' };

export default async function EssentialsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, businessAddress: true, owner: { select: { phone: true } }, locations: { orderBy: { createdAt: 'asc' }, take: 1, select: { id: true, name: true, phone: true, email: true } } },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const location = business.locations[0];

  return <main className={styles.page} dir="rtl">
    <form action={saveEssentials}>
      <header className={styles.header}>
        <div className={styles.progress} aria-label="مرحله اول انتشار پروفایل"><span /><span /><span /></div>
        <nav className={styles.navigation} aria-label="ناوبری مراحل">
          <div className={styles.actions}>
            <button className={styles.save} type="submit" name="destination" value="exit">ذخیره و خروج</button>
            <button className={styles.continue} type="submit" name="destination" value="location">ادامه <span aria-hidden="true">←</span></button>
            <button className={styles.preview} type="button" disabled>پیش‌نمایش</button>
          </div>
          <Link className={styles.back} href="/online-presence/marketplace-profile/essentials-overview" aria-label="بازگشت"><ArrowRight size={21} /></Link>
        </nav>
      </header>
      <section className={styles.content} aria-labelledby="essentials-title">
        <h1 id="essentials-title">اطلاعات اصلی محل کسب‌وکار</h1>
        <p className={styles.subtitle}>نامی که می‌خواهید با آن شناخته شوید و راه‌های ارتباط مشتریان با خود را وارد کنید.</p>
        <input type="hidden" name="locationId" value={location?.id ?? ''} />
        <div className={styles.field}><label htmlFor="name">نام نمایشی محل کسب‌وکار</label><input id="name" name="name" defaultValue={location?.name ?? business.name} maxLength={60} required /><p>این نام هنگام رزرو آنلاین و در اعلان‌ها به مشتریان نمایش داده می‌شود.</p></div>
        <div className={styles.field}><label htmlFor="phone">شماره تلفن کسب‌وکار</label><p>مشتریان در صورت نیاز می‌توانند از طریق این شماره با شما تماس بگیرند.{!location?.phone?.trim() && business.owner.phone?.trim() ? ' شماره حساب شما به‌صورت پیش‌فرض وارد شده است؛ در صورت نیاز آن را تغییر دهید.' : ''}</p><input id="phone" name="phone" type="tel" dir="ltr" defaultValue={location?.phone?.trim() || business.owner.phone?.trim() || ''} maxLength={32} /></div>
        <div className={styles.field}><label htmlFor="email">ایمیل کسب‌وکار</label><p>پاسخ مشتریان به ایمیل‌های نوبت به این نشانی ارسال می‌شود.</p><input id="email" name="email" type="email" dir="ltr" defaultValue={location?.email ?? ''} maxLength={320} /></div>
      </section>
    </form>
  </main>;
}
