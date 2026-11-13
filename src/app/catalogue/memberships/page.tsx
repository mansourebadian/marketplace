import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import styles from './memberships.module.css';
import { StartMembershipButton } from './StartMembershipButton';

export const metadata: Metadata = { title: 'عضویت‌ها | آرینو' };

export default async function MembershipsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, businessAddress: true },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/catalogue/memberships" label="عضویت‌های کسب‌وکار">
    <section className={styles.page} aria-labelledby="membership-title">
      <div className={styles.content}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>عضویت‌های کسب‌وکار</span>
          <h1 id="membership-title">با مزایای ویژه، مشتریان وفادار بسازید</h1>
          <p>هنوز عضویتی ثبت نشده است. با ارائه عضویت می‌توانید مشتریان را به مراجعه دوباره تشویق کنید و ارتباطی ماندگار با آن‌ها بسازید.</p>
          <ul>
            <li><Check size={19} aria-hidden="true" /> ارائه مزایا و پیشنهادهای ویژه به اعضا</li>
            <li><Check size={19} aria-hidden="true" /> تشویق مشتریان به مراجعه منظم</li>
            <li><Check size={19} aria-hidden="true" /> ایجاد ارتباط پایدار با مشتریان</li>
          </ul>
          <StartMembershipButton />
        </div>
        <div className={styles.art} aria-hidden="true">
          <div className={`${styles.card} ${styles.cardBack}`}><span>عضویت ویژه</span><strong>مزایای اختصاصی</strong></div>
          <div className={`${styles.card} ${styles.cardMiddle}`}><span>عضویت طلایی</span><strong>پیشنهادهای ویژه</strong></div>
          <div className={`${styles.card} ${styles.cardFront}`}><span>عضویت آرینو</span><small>برای مشتریان وفادار</small><strong>مزایای بیشتر،<br />تجربه‌ای بهتر</strong></div>
        </div>
      </div>
    </section>
  </BusinessWorkspace>;
}
