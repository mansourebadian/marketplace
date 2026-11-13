import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarCheck, Rocket, Store } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import styles from './overview.module.css';

export const metadata: Metadata = { title: 'انتشار پروفایل | آرینو' };

const steps = [
  { icon: Store, title: 'درباره کسب‌وکارتان بگویید', description: 'اطلاعات اولیه مانند نام، موقعیت و ساعت‌های کاری کسب‌وکارتان را وارد کنید.' },
  { icon: Rocket, title: 'در فضای آنلاین بدرخشید', description: 'تصاویر، ویژگی‌های برجسته و توضیحی جذاب اضافه کنید تا پروفایل شما بیشتر دیده شود.' },
  { icon: CalendarCheck, title: 'رزرو آنلاین دریافت کنید', description: 'با تکمیل پروفایل، آماده دریافت رزرو مستقیم و آنلاین از بازار آرینو خواهید بود.' },
];

export default async function MarketplaceProfileOverviewPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <main className={styles.page} dir="rtl">
    <header className={styles.header}>
      <div className={styles.progress} aria-label="مراحل انتشار پروفایل"><span /><span /><span /></div>
      <div className={styles.actions}>
        <Link href="/online-presence/marketplace-profile" className={styles.close}>بستن</Link>
        <Link className={styles.continue} href="/online-presence/marketplace-profile/essentials-overview">ادامه <span aria-hidden="true">←</span></Link>
      </div>
    </header>
    <div className={styles.content}>
      <h1>با انتشار پروفایل در <span>بازار آرینو</span>، کسب‌وکارتان را رشد دهید</h1>
      <ol className={styles.steps}>{steps.map(({ icon: Icon, title, description }, index) => <li key={title}>
        <div className={styles.stepCopy}><h2><span>{index + 1}</span> {title}</h2><p>{description}</p></div>
        <div className={styles.icon} aria-hidden="true"><Icon size={32} strokeWidth={1.7} /></div>
      </li>)}</ol>
    </div>
  </main>;
}
