import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PersianDateField } from '@/app/team/team-members/add/persian-date-field';
import { ReferralField } from './referral-field';
import { ClientSections } from './client-sections';
import { ClientForm } from './client-form';
import { ProfilePhoto } from './profile-photo';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'افزودن مشتری | آرینو' };

export default async function AddClientPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'OWNER') redirect('/auth/business');
  const business = await prisma.business.findUnique({ where: { ownerId: session.user.id }, select: { id: true, businessAddress: true } });
  if (!business) redirect('/onboarding/business-name');
  if (!business.businessAddress) redirect('/onboarding/business-address');
  const [customers, manualClients] = await Promise.all([prisma.user.findMany({ where: { businessReservations: { some: { businessId: business.id } } }, select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true }, orderBy: { name: 'asc' } }), prisma.businessClient.findMany({ where: { businessId: business.id }, select: { id: true, firstName: true, lastName: true, email: true, phone: true } })]);
  const referrals = [...customers.map(customer => ({ id: customer.id, name: customer.name || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.phone || (customer.email.endsWith('@phone.invalid') ? 'مشتری' : customer.email), email: customer.email.endsWith('@phone.invalid') ? '' : customer.email, phone: customer.phone })), ...manualClients.map(customer => ({ id: customer.id, name: [customer.firstName, customer.lastName].filter(Boolean).join(' '), email: customer.email || '', phone: customer.phone }))];

  return <main className={styles.page} dir="rtl"><ClientForm>
    <header className={styles.header}><div className={styles.headerInner}><span>افزودن مشتری جدید</span><div><Link href="/clients/list" className={styles.close}>بستن</Link><button type="submit" className={styles.save}>ذخیره</button></div></div></header>
    <div className={styles.container}><h1>افزودن مشتری جدید</h1><ClientSections>
      <section id="profile" className={styles.section}><h2>پروفایل</h2><p>اطلاعات شخصی مشتری را وارد کنید.</p><ProfilePhoto />
        <div className={styles.grid}>
          <label>نام<input name="firstName" maxLength={100} placeholder="مثلاً سارا" autoComplete="given-name" /></label>
          <label>نام خانوادگی<input name="lastName" placeholder="مثلاً احمدی" autoComplete="family-name" /></label>
          <label>ایمیل<input name="email" type="email" placeholder="example@domain.com" dir="ltr" autoComplete="email" /></label>
          <label>شماره همراه<div className={styles.phone}><select aria-label="کد کشور" defaultValue="+98"><option value="+98">+98</option></select><input name="phone" type="tel" placeholder="912 345 6789" dir="ltr" autoComplete="tel-national" /></div></label>
          <PersianDateField name="birthday" label="تاریخ تولد" /><span className={styles.blank} />
          <label>جنسیت<select name="gender" defaultValue=""><option value="">انتخاب کنید</option><option value="female">زن</option><option value="male">مرد</option><option value="other">سایر</option><option value="undisclosed">ترجیح می‌دهم نگویم</option></select></label>
          <label>ضمیر مورد استفاده<select name="pronouns" defaultValue=""><option value="">انتخاب کنید</option><option value="she">او (زن)</option><option value="he">او (مرد)</option><option value="they">خنثی</option><option value="other">سایر</option></select></label>
        </div></section>
        <section className={styles.section}><h2>اطلاعات تکمیلی</h2><p>اطلاعات بیشتری دربارهٔ مشتری وارد کنید.</p><div className={styles.grid}>
          <label>نحوه آشنایی<select name="source" defaultValue="walk-in"><option value="walk-in">مراجعه حضوری</option><option value="referral">معرفی مشتری</option><option value="online">اینترنت</option><option value="other">سایر</option></select><small>نحوه آشنایی مشتری با کسب‌وکار شما</small></label>
          <ReferralField customers={referrals} />
          <label>زبان ترجیحی<select name="language" defaultValue=""><option value="">انتخاب زبان</option><option value="fa">فارسی</option><option value="en">انگلیسی</option></select></label>
          <label>شغل<input name="occupation" maxLength={255} placeholder="شغل مشتری را وارد کنید" /></label>
          <label>کشور<select name="country" defaultValue=""><option value="">انتخاب کشور</option><option value="IR">ایران</option></select></label><span className={styles.blank} />
          <label>ایمیل اضافی<input name="additionalEmail" type="email" placeholder="example@domain.com" dir="ltr" /></label>
          <label>شماره تماس اضافی<input name="additionalPhone" type="tel" placeholder="شماره تماس اضافی" dir="ltr" /></label>
          <label className={styles.full}>برچسب‌ها<input placeholder="انتخاب یا ایجاد برچسب" disabled /><small>مدیریت برچسب‌ها به‌زودی فعال می‌شود.</small></label>
        </div></section>
    </ClientSections></div>
  </ClientForm></main>;
}
