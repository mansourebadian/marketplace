import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BusinessWorkspace } from '@/components/features/calendar/BusinessWorkspace';
import styles from '@/components/features/settings/BusinessDetails.module.css';

export const metadata: Metadata = { title: 'جزئیات کسب‌وکار | فرشا' };

function parseObject(value: string | null): Record<string, unknown> {
  try { const parsed: unknown = JSON.parse(value || '{}'); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}; } catch { return {}; }
}

export default async function BusinessDetailsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { name: true, website: true, rubika: true, instagram: true, bale: true, taxMode: true, teamLanguage: true, clientLanguage: true, teamSize: true, serviceLocation: true, previousSoftware: true, businessLocation: true, businessAddress: true, categories: { select: { slug: true, customName: true }, orderBy: { position: 'asc' } } },
  });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const address = parseObject(business.businessAddress);
  const addressValue = (key: string) => typeof address[key] === 'string' ? address[key] as string : null;
  const fields = [
    ['نام کسب‌وکار', business.name], ['کشور', addressValue('country') || 'ایران'],
    ['واحد پول', 'ریال'], ['محاسبهٔ مالیات', business.taxMode === 'exclude' ? 'قیمت‌ها بدون مالیات هستند' : 'قیمت‌ها شامل مالیات هستند'],
    ['زبان پیش‌فرض تیم', business.teamLanguage || 'فارسی'], ['زبان پیش‌فرض مشتریان', business.clientLanguage || 'فارسی'],
  ];
  const website = business.website && /^https?:\/\//i.test(business.website) ? business.website : business.website ? `https://${business.website}` : null;
  return <BusinessWorkspace ownerName={session.user.name || business.name} activePage="/setup" label="جزئیات کسب‌وکار">
    <div className={styles.scroll}><div className={styles.container}>
      <nav className={styles.breadcrumb} aria-label="مسیر صفحه"><Link className={styles.back} href="/setup"><ArrowRight size={18} /> بازگشت</Link><Link href="/setup">تنظیمات فضای کاری</Link><span>·</span><span>راه‌اندازی کسب‌وکار</span></nav>
      <div className={styles.layout}>
        <aside className={styles.menu}><h2>راه‌اندازی کسب‌وکار</h2><nav aria-label="منوی راه‌اندازی کسب‌وکار"><a href="#business-info" aria-current="page">جزئیات کسب‌وکار</a><Link href="/setup/business-setup/locations">موقعیت‌ها</Link>{['منوی خدمات', 'فهرست محصولات', 'اشتراک‌ها', 'پکیج‌ها', 'فهرست مشتریان'].map(title => <a key={title} href="#" className={styles.externalItem}><ArrowUpRight size={17} />{title}</a>)}</nav></aside>
        <div className={styles.main}><header className={styles.heading}><h1>جزئیات کسب‌وکار</h1><p>اطلاعات کسب‌وکار، ترجیحات و لینک‌های بیرونی خود را مشاهده کنید.</p></header>
          <section id="business-info" className={styles.card}><div className={styles.cardHeader}><h2>اطلاعات کسب‌وکار</h2><Link className={styles.editButton} href="/setup/business-setup/business-details/edit">ویرایش</Link></div><dl className={styles.fields}>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'ثبت نشده'}</dd></div>)}</dl>
            <section className={styles.links}><h2>لینک‌های بیرونی</h2><dl className={styles.fields}>{[['روبیکا', business.rubika], ['بله', business.bale], ['اینستاگرام', business.instagram]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={styles.add}>{value ? <a href={/^https?:\/\//i.test(String(value)) ? String(value) : `https://${value}`} target="_blank" rel="noopener noreferrer" dir="ltr">{String(value)}</a> : <Link href="/setup/business-setup/business-details/edit?section=external-links">افزودن</Link>}</dd></div>)}<div><dt>وب‌سایت</dt><dd className={styles.add}>{website ? <a href={website} target="_blank" rel="noopener noreferrer" dir="ltr">{business.website}</a> : <Link href="/setup/business-setup/business-details/edit?section=external-links">افزودن</Link>}</dd></div></dl></section>
          </section>
        </div>
      </div>
    </div></div>
  </BusinessWorkspace>;
}

