'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Bell, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, ChevronLeft, CircleHelp, ContactRound, Grid2X2Plus, House, Megaphone, MessageCircle, Rocket, Search, Settings, Smile, Tag, TrendingUp, UsersRound, Wallet } from 'lucide-react';
import styles from './BusinessCalendar.module.css';
import { SetupGuide } from './SetupGuide';

const navigation = [
  { icon: House, label: 'خانه', href: '/dashboard' },
  { icon: CalendarDays, label: 'تقویم', href: '/calendar' },
  { icon: Tag, label: 'فروش' },
  { icon: Smile, label: 'مشتریان' },
  { icon: BookOpen, label: 'فهرست خدمات' },
  { icon: ContactRound, label: 'حضور آنلاین' },
  { icon: Megaphone, label: 'بازاریابی' },
  { icon: UsersRound, label: 'تیم' },
  { icon: TrendingUp, label: 'گزارش‌ها' },
  { icon: Grid2X2Plus, label: 'برنامه‌ها' },
  { icon: Settings, label: 'تنظیمات', href: '/setup' },
];

const catalogGroups = [{ title: 'کاتالوگ', items: ['فهرست خدمات', 'بسته‌ها', 'عضویت‌ها', 'محصولات'] }, { title: 'مدیریت موجودی', items: ['انبارگردانی', 'سفارش‌های موجودی', 'تأمین‌کنندگان'] }];

export function BusinessWorkspace({ ownerName, activePage, label, children }: {
  ownerName: string;
  activePage: '/dashboard' | '/calendar' | '/sales/daily-sales' | '/sales/register' | '/sales/appointments-list' | '/clients/list' | '/setup' | '/catalogue/services' | '/catalogue/memberships' | '/catalogue/products' | '/team/team-members' | '/team/scheduled-shifts' | '/online-presence/marketplace-profile';
  label: string;
  children: ReactNode;
}) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(activePage === '/catalogue/memberships' || activePage === '/catalogue/products');
  const [teamOpen, setTeamOpen] = useState(activePage.startsWith('/team/'));
  const [presenceOpen, setPresenceOpen] = useState(activePage.startsWith('/online-presence/'));
  const [salesOpen, setSalesOpen] = useState(activePage.startsWith('/sales/'));
  const [clientsOpen, setClientsOpen] = useState(activePage.startsWith('/clients/'));
  const initials = ownerName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  useEffect(() => { if (!setupOpen) return; const close = (event: KeyboardEvent) => event.key === 'Escape' && setSetupOpen(false); document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [setupOpen]);

  return <main dir="rtl" className={styles.shell} aria-label={label}>
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="آرینو، صفحهٔ اصلی">آرینو</Link>
      <div className={styles.headerActions}>
        <button type="button" className={styles.setup} onClick={() => setSetupOpen(true)}><Rocket size={19} /> ادامهٔ راه‌اندازی <ChevronLeft size={18} /></button>
        {[Search, ChartNoAxesColumnIncreasing, Bell, MessageCircle, Wallet].map((Icon, index) => <span className={styles.headerIcon} key={index}><Icon size={23} strokeWidth={1.7} /></span>)}
        <span className={styles.avatar} title={ownerName}>{initials}</span>
      </div>
    </header>
    <aside className={styles.sidebar} aria-label="منوی مدیریت کسب‌وکار">
      {navigation.map(({ icon: Icon, label: title, href }) => href
        ? <Link key={title} href={href} title={title} aria-label={title} aria-current={activePage === href ? 'page' : undefined} className={activePage === href ? styles.activeNav : styles.navIcon}><Icon size={25} strokeWidth={1.65} /></Link>
        : Icon === Tag
          ? <button key={title} type="button" title={title} aria-label={title} aria-expanded={salesOpen} aria-controls="business-sales-panel" className={`${styles.navIcon} ${styles.catalogTrigger} ${salesOpen || activePage.startsWith('/sales/') ? styles.activeNav : ''}`} onClick={() => { setSalesOpen(open => !open); setCatalogOpen(false); setTeamOpen(false); setPresenceOpen(false); setClientsOpen(false); }}><Icon size={25} strokeWidth={1.65} /></button>
          : Icon === Smile
          ? <button key={title} type="button" title={title} aria-label={title} aria-expanded={clientsOpen} aria-controls="business-clients-panel" className={`${styles.navIcon} ${styles.catalogTrigger} ${clientsOpen || activePage.startsWith('/clients/') ? styles.activeNav : ''}`} onClick={() => { setClientsOpen(open => !open); setSalesOpen(false); setCatalogOpen(false); setTeamOpen(false); setPresenceOpen(false); }}><Icon size={25} strokeWidth={1.65} /></button>
          : Icon === BookOpen
          ? <button key={title} type="button" title={title} aria-label={title} aria-expanded={catalogOpen} aria-controls="business-catalog-panel" className={`${styles.navIcon} ${styles.catalogTrigger} ${catalogOpen || activePage.startsWith('/catalogue/') ? styles.activeNav : ''}`} onClick={() => { setCatalogOpen(open => !open); setTeamOpen(false); setPresenceOpen(false); setSalesOpen(false); setClientsOpen(false); }}><Icon size={25} strokeWidth={1.65} /></button>
          : Icon === UsersRound
          ? <button key={title} type="button" title={title} aria-label={title} aria-expanded={teamOpen} aria-controls="business-team-panel" className={`${styles.navIcon} ${styles.catalogTrigger} ${teamOpen || activePage.startsWith('/team/') ? styles.activeNav : ''}`} onClick={() => { setTeamOpen(open => !open); setCatalogOpen(false); setPresenceOpen(false); setSalesOpen(false); setClientsOpen(false); }}><Icon size={25} strokeWidth={1.65} /></button>
          : Icon === ContactRound
          ? <button key={title} type="button" title={title} aria-label={title} aria-expanded={presenceOpen} aria-controls="business-presence-panel" className={`${styles.navIcon} ${styles.catalogTrigger} ${presenceOpen || activePage.startsWith('/online-presence/') ? styles.activeNav : ''}`} onClick={() => { setPresenceOpen(open => !open); setCatalogOpen(false); setTeamOpen(false); setSalesOpen(false); setClientsOpen(false); }}><Icon size={25} strokeWidth={1.65} /></button>
          : <span key={title} title={title} aria-label={title} className={styles.navIcon}><Icon size={25} strokeWidth={1.65} /></span>)}
      <span className={styles.help} title="راهنما"><CircleHelp size={24} /></span>
    </aside>
    <div className={styles.workspaceBody}>
      {clientsOpen && <aside id="business-clients-panel" className={styles.catalogPanel} aria-label="منوی مشتریان">
        <button type="button" className={styles.catalogCollapse} onClick={() => setClientsOpen(false)} aria-label="بستن منوی مشتریان"><ChevronLeft size={18} /></button>
        <div className={styles.catalogSections}>
          <section className={styles.catalogGroup}><h2>مشتریان</h2><ul><li><Link href="/clients/list" className={styles.catalogLink} aria-current={activePage === '/clients/list' ? 'page' : undefined}>فهرست مشتریان</Link></li><li>بخش‌بندی مشتریان</li></ul></section>
          <section className={styles.catalogGroup}><h2>تعامل</h2><ul><li>وفاداری مشتریان</li><li>اعتبار آنلاین</li></ul></section>
        </div>
      </aside>}
      {salesOpen && <aside id="business-sales-panel" className={styles.catalogPanel} aria-label="منوی فروش">
        <button type="button" className={styles.catalogCollapse} onClick={() => setSalesOpen(false)} aria-label="بستن منوی فروش"><ChevronLeft size={18} /></button>
        <div className={styles.catalogSections}>
          <section className={styles.catalogGroup}><h2>فروش</h2><ul><li><Link href="/sales/daily-sales" className={styles.catalogLink} aria-current={activePage === '/sales/daily-sales' ? 'page' : undefined}>خلاصه فروش روزانه</Link></li><li><Link href="/sales/register" className={styles.catalogLink} aria-current={activePage === '/sales/register' ? 'page' : undefined}>صندوق</Link></li><li><Link href="/sales/appointments-list" className={styles.catalogLink} aria-current={activePage === '/sales/appointments-list' ? 'page' : undefined}>نوبت‌ها</Link></li>{['فروش‌ها', 'پرداخت‌ها'].map(item => <li key={item}>{item}</li>)}</ul></section>
          <section className={styles.catalogGroup}><h2>اقلام فروخته‌شده</h2><ul>{['کارت‌های هدیه', 'بسته‌ها', 'عضویت‌ها', 'سفارش محصولات'].map(item => <li key={item}>{item}</li>)}</ul></section>
        </div>
      </aside>}
      {presenceOpen && <aside id="business-presence-panel" className={styles.catalogPanel} aria-label="منوی حضور آنلاین">
        <button type="button" className={styles.catalogCollapse} onClick={() => setPresenceOpen(false)} aria-label="بستن منوی حضور آنلاین"><ChevronLeft size={18} /></button>
        <div className={styles.catalogSections}>
          <section className={styles.catalogGroup}>
            <h2>رزرو آنلاین</h2>
            <ul><li><Link href="/online-presence/marketplace-profile" className={styles.catalogLink} aria-current={activePage === '/online-presence/marketplace-profile' ? 'page' : undefined}>پروفایل در بازار آرینو</Link></li>{['رزرو با گوگل', 'رزرو با فیسبوک و اینستاگرام', 'لینک‌های مستقیم'].map(item => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className={styles.catalogGroup}>
            <h2>وب‌سایت‌های شما</h2>
            <ul>{['وب‌سایت هوشمند', 'فروشگاه محصولات'].map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>
      </aside>}
      {teamOpen && <aside id="business-team-panel" className={styles.catalogPanel} aria-label="منوی تیم">
        <button type="button" className={styles.catalogCollapse} onClick={() => setTeamOpen(false)} aria-label="بستن منوی تیم"><ChevronLeft size={18} /></button>
        <div className={styles.catalogSections}>
          <section className={styles.catalogGroup}>
            <h2>تیم</h2>
            <ul><li><Link href="/team/team-members" aria-current={activePage === '/team/team-members' ? 'page' : undefined} className={styles.catalogLink}>اعضای تیم</Link></li><li><Link href="/team/scheduled-shifts" aria-current={activePage === '/team/scheduled-shifts' ? 'page' : undefined} className={styles.catalogLink}>شیفت‌های برنامه‌ریزی‌شده</Link></li>{['برگه‌های ساعات کاری', 'پرداخت حقوق'].map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>
      </aside>}
      {catalogOpen && <aside id="business-catalog-panel" className={styles.catalogPanel} aria-label="کاتالوگ و مدیریت موجودی">
        <button type="button" className={styles.catalogCollapse} onClick={() => setCatalogOpen(false)} aria-label="بستن منوی کاتالوگ"><ChevronLeft size={18} /></button>
        <div className={styles.catalogSections}>
        {catalogGroups.map(group => <section key={group.title} className={styles.catalogGroup} aria-label={group.title}>
          <h2>{group.title}</h2>
          <ul>{group.items.map((item, index) => {
            const href = group === catalogGroups[0] ? ['/catalogue/services', undefined, '/catalogue/memberships', '/catalogue/products'][index] : undefined;
            return <li key={item}>{href ? <Link href={href} aria-current={activePage === href ? 'page' : undefined} className={styles.catalogLink}>{item}</Link> : item}</li>;
          })}</ul>
        </section>)}
        </div>
      </aside>}
      <div className={styles.workspacePage}>{children}</div>
    </div>
    {setupOpen && <SetupGuide onClose={() => setSetupOpen(false)} />}

  </main>;
}


