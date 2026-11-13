import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Check, Search } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import { StartProductsButton } from './StartProductsButton';
import styles from './products.module.css';

export const metadata: Metadata = { title: 'محصولات | آرینو' };

export default async function ProductsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, businessAddress: true },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');

  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/catalogue/products" label="محصولات کسب‌وکار">
    <section className={styles.page} aria-labelledby="products-title">
      <div className={styles.content}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>فهرست محصولات</span>
          <h1 id="products-title">موجودی خود را با فهرست محصولات مدیریت کنید</h1>
          <p>هنوز محصولی ثبت نشده است. با فهرست محصولات، سفارش، پیگیری موجودی و فروش محصولات خود را آسان‌تر مدیریت کنید.</p>
          <ul>
            <li><Check size={19} aria-hidden="true" /> با ثبت یک محصول یا افزودن چند محصول شروع کنید</li>
            <li><Check size={19} aria-hidden="true" /> محصولات را با برندها و دسته‌بندی‌ها مرتب کنید</li>
            <li><Check size={19} aria-hidden="true" /> موجودی محصولات را پیگیری کنید</li>
            <li><Check size={19} aria-hidden="true" /> محصولات خود را برای فروش آماده کنید</li>
          </ul>
          <StartProductsButton />
        </div>
        <div className={styles.art} aria-hidden="true">
          <div className={styles.productList}>
            <div className={styles.listHeading}><strong>محصولات</strong><Search size={16} /></div>
            <div className={styles.grid}>
              {['mint', 'yellow', 'pink', 'sand', 'blue', 'lilac'].map((color, index) => <div className={styles.item} key={color}>
                <div className={`${styles.itemImage} ${styles[color]}`}><div className={`${styles.bottle} ${index % 2 ? styles.tube : ''}`}><span /></div></div>
                <b>{['۲۰۰', '۳۵۰', '۱۸۰', '۲۵۰', '۳۰۰', '۲۲۰'][index]} هزار تومان</b><small>{index % 2 ? 'نرم‌کننده' : 'شامپو'}</small>
              </div>)}
            </div>
          </div>
          <div className={styles.featured}><div className={styles.featureImage}><div className={styles.nailPolish}><span /></div></div><strong>لاک ناخن</strong><small>موجود در انبار</small></div>
        </div>
      </div>
    </section>
  </BusinessWorkspace>;
}
