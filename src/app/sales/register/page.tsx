import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Check, Wallet } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import styles from './register.module.css';

export const metadata: Metadata = { title: 'صندوق | آرینو' };

export default async function RegisterPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { name: true, businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/sales/register" label="صندوق">
    <section className={styles.page} aria-labelledby="register-title">
      <div className={styles.content}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>مدیریت صندوق</p>
          <h1 id="register-title">گردش وجه نقد را با صندوق مدیریت کنید</h1>
          <p className={styles.description}>با صندوق، پرداخت‌ها و جابه‌جایی‌های وجه نقد روزانه را در یک جا پیگیری کنید.</p>
          <ul className={styles.benefits}>
            <li><Check size={19} /> ثبت باز و بسته شدن روزانه صندوق</li>
            <li><Check size={19} /> پیگیری ورود و خروج وجه نقد</li>
            <li><Check size={19} /> اطلاع از موجودی صندوق و تنخواه</li>
          </ul>
          <div className={styles.actions}><button type="button" disabled title="راه‌اندازی صندوق به‌زودی فعال می‌شود">شروع کنید</button><Link href="/help/register" target="_blank" rel="noopener noreferrer">اطلاعات بیشتر</Link></div>
          <p id="register-details" className={styles.note}>راه‌اندازی و ثبت گردش صندوق به‌زودی در دسترس خواهد بود.</p>
        </div>
        <div className={styles.visual} aria-label="نمونه‌ای از نمای صندوق">
          <div className={styles.phone}><div className={styles.phoneScreen}>
            <div className={styles.phoneHeader}><strong>صندوق</strong><span>نمونه</span></div>
            <div className={styles.balance}><span>موجودی صندوق</span><strong>۳٬۲۵۰٬۰۰۰ <small>تومان</small></strong><p>نمایی از موجودی روزانه</p><div><span>＋ ورود وجه</span><span>− خروج وجه</span></div></div>
            <h2>فعالیت‌های اخیر</h2>
            {[['فروش نقدی', '۱٬۶۰۰٬۰۰۰', true], ['فروش نقدی', '۳۰۰٬۰۰۰', true], ['خروج وجه', '۵۰٬۰۰۰', false]].map(([label, amount, incoming]) => <div className={styles.activity} key={String(label) + String(amount)}><span className={styles.activityIcon}>{incoming ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</span><span>{label}</span><strong>{amount}</strong></div>)}
            <div className={styles.phoneFooter}><Wallet size={15} /> اطلاعات نمایشی</div>
          </div></div>
        </div>
      </div>
    </section>
  </BusinessWorkspace>;
}
