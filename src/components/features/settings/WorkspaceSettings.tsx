'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CreditCard, FileText, Landmark, Smile, Store, Tag, UsersRound, type LucideIcon } from 'lucide-react';
import { BusinessWorkspace } from '../calendar/BusinessWorkspace';
import styles from './WorkspaceSettings.module.css';

const sections: { id: string; title: string; cards: { icon?: LucideIcon; title: string; description: string }[] }[] = [
  { id: 'settings', title: 'تنظیمات', cards: [
    { icon: Store, title: 'راه‌اندازی کسب‌وکار', description: 'اطلاعات کسب‌وکار خود را شخصی‌سازی و شعبه‌ها را مدیریت کنید.' },
    { icon: CalendarDays, title: 'زمان‌بندی', description: 'زمان‌های دسترسی، منابع قابل رزرو و تنظیمات رزرو آنلاین را مدیریت کنید.' },
    { icon: Tag, title: 'فروش', description: 'روش‌های پرداخت، مالیات، رسیدها، هزینهٔ خدمات و کارت‌های هدیه را تنظیم کنید.' },
    { icon: Smile, title: 'مشتریان', description: 'منابع جذب مشتری را شخصی‌سازی و برچسب‌های مشتریان را مدیریت کنید.' },
    { icon: Landmark, title: 'صورتحساب‌ها', description: 'صورتحساب‌های فرشا، پیامک‌ها، افزونه‌ها و هزینه‌های حساب را مدیریت کنید.' },
    { icon: UsersRound, title: 'تیم', description: 'سطوح دسترسی، دستمزد و مرخصی اعضای تیم را مدیریت کنید.' },
    { icon: FileText, title: 'فرم‌ها', description: 'قالب فرم‌های موردنیاز مشتریان را تنظیم کنید.' },
    { icon: CreditCard, title: 'پرداخت‌ها', description: 'روش‌های پرداخت، دستگاه‌های کارت‌خوان و سیاست پرداخت خود را تنظیم کنید.' },
  ] },
  { id: 'online-presence', title: 'حضور آنلاین', cards: [
    { title: 'پروفایل در بازار فرشا', description: 'با رزرو آنلاین، مشتریان جدید جذب کنید.' },
    { title: 'رزرو با گوگل', description: 'از جست‌وجوی گوگل و گوگل مپس، رزرو آنلاین دریافت کنید.' },
    { title: 'رزرو با فیسبوک و اینستاگرام', description: 'از صفحه‌های شبکه‌های اجتماعی خود رزرو آنلاین دریافت کنید.' },
    { title: 'فروشگاه محصولات', description: 'فروشگاه آنلاین خود را راه‌اندازی کنید تا مشتریان بتوانند محصولات شما را اینترنتی بخرند.' },
    { title: 'ساخت لینک رزرو', description: 'لینک رزرو قابل اشتراک‌گذاری و کد QR بسازید.' },
  ] },
  { id: 'marketing', title: 'بازاریابی', cards: [
    { title: 'بازاریابی انبوه', description: 'پیشنهادهای ویژه و خبرهای مهم را از طریق ایمیل و پیامک با مشتریان به اشتراک بگذارید.' },
    { title: 'خودکارسازی', description: 'با پیام‌های خودکار با مشتریان در ارتباط باشید و آن‌ها را به‌روز نگه دارید.' },
    { title: 'تخفیف‌ها و پیشنهادها', description: 'با کد تخفیف، فروش ویژه و پیشنهادهای تبلیغاتی، مشتریان را حفظ و تشویق کنید.' },
    { title: 'قیمت‌گذاری هوشمند', description: 'قیمت خدمات را برای ساعت‌های شلوغ و خلوت تنظیم کنید.' },
    { title: 'پیام‌های ارسال‌شده', description: 'فهرست ایمیل‌ها، پیامک‌ها و اعلان‌های ارسال‌شده به مشتریان را ببینید.' },
    { title: 'امتیازها و دیدگاه‌ها', description: 'امتیازها و نظرهایی را که مشتریان پس از مراجعه ثبت کرده‌اند ببینید.' },
  ] },
  { id: 'other', title: 'سایر', cards: [
    { title: 'افزونه‌ها', description: 'با افزونه‌های فرشا، امکانات بیشتری به کسب‌وکار خود اضافه کنید.' },
    { title: 'یکپارچه‌سازی‌ها', description: 'فرشا را به برنامه‌ها و سرویس‌های دیگر متصل کنید.' },
  ] },
];

export function WorkspaceSettings({ ownerName, businessName }: { ownerName: string; businessName: string }) {
  const [activeSection, setActiveSection] = useState('settings');
  useEffect(() => {
    const syncHash = () => {
      const id = window.location.hash.slice(1);
      if (sections.some(section => section.id === id)) setActiveSection(id);
      else setActiveSection('settings');
    };
    const frame = requestAnimationFrame(syncHash);
    window.addEventListener('hashchange', syncHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', syncHash); };
  }, []);

  return <BusinessWorkspace ownerName={ownerName} activePage="/setup" label="تنظیمات فضای کاری">
    <div className={styles.scroll}>
      <div className={styles.container}>
        <header className={styles.heading}>
          <h1>تنظیمات فضای کاری</h1>
          <p>تنظیمات «{businessName}» را مدیریت کنید.</p>
        </header>
        <nav className={styles.tabs} aria-label="بخش‌های تنظیمات">
          {sections.map(section => <a key={section.id} href={`#${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined} onClick={() => {
            setActiveSection(section.id);
          }}>{section.title}</a>)}
        </nav>
        {sections.map((section, index) => <section key={section.id} id={section.id} className={styles.section} aria-label={section.title}>
          {index > 0 && <h2>{section.title}</h2>}
          <div className={styles.cards}>
            {section.cards.map(({ icon: Icon, title, description }) => <article key={title} className={`${styles.card} ${index > 0 ? styles.optionCard : ''}`}>
              {Icon && <Icon size={22} strokeWidth={1.65} aria-hidden="true" />}
              <h3>{title}</h3>
              <p>{description}</p>
              {index > 0 && <span className={styles.viewLabel}>مشاهده <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" /></span>}
            </article>)}
          </div>
        </section>)}
      </div>
    </div>
  </BusinessWorkspace>;
}
