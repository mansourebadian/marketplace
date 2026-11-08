'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Bell, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, ChevronLeft, CircleHelp, ContactRound, Grid2X2Plus, House, Megaphone, MessageCircle, Rocket, Search, Settings, Smile, Tag, TrendingUp, UsersRound, Wallet } from 'lucide-react';
import styles from './BusinessCalendar.module.css';
import { SetupGuide } from './SetupGuide';

const navigation = [
  { icon: House, label: 'خانه' },
  { icon: CalendarDays, label: 'تقویم', href: '/calendar' },
  { icon: Tag, label: 'فروش' },
  { icon: Smile, label: 'مشتریان' },
  { icon: BookOpen, label: 'فهرست خدمات' },
  { icon: ContactRound, label: 'مخاطبین' },
  { icon: Megaphone, label: 'بازاریابی' },
  { icon: UsersRound, label: 'تیم' },
  { icon: TrendingUp, label: 'گزارش‌ها' },
  { icon: Grid2X2Plus, label: 'برنامه‌ها' },
  { icon: Settings, label: 'تنظیمات', href: '/setup' },
];

const catalogGroups = [{ title: 'کاتالوگ', items: ['فهرست خدمات', 'بسته‌ها', 'عضویت‌ها', 'محصولات'] }, { title: 'مدیریت موجودی', items: ['انبارگردانی', 'سفارش‌های موجودی', 'تأمین‌کنندگان'] }];

export function BusinessWorkspace({ ownerName, activePage, label, children }: {
  ownerName: string;
  activePage: '/calendar' | '/setup' | '/catalogue/services' | '/catalogue/memberships' | '/catalogue/products' | '/team/team-members';
  label: string;
  children: ReactNode;
}) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(activePage === '/catalogue/memberships' || activePage === '/catalogue/products');
  const [teamOpen, setTeamOpen] = useState(activePage === '/team/team-members');
  const initials = ownerName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  useEffect(() => { if (!setupOpen) return; const close = (event: KeyboardEvent) => event.key === 'Escape' && setSetupOpen(false); document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [setupOpen]);

  return <main dir="rtl" className={styles.shell} aria-label={label}>
    <header className={styles.header}>
      <span className={styles.logo}>فرشا</span>
      <div className={styles.headerActions}>
        <button type="button" className={styles.setup} onClick={() => setSetupOpen(true)}><Rocket size={19} /> ادامهٔ راه‌اندازی <ChevronLeft size={18} /></button>
        {[Search, ChartNoAxesColumnIncreasing, Bell, MessageCircle, Wallet].map((Icon, index) => <span className={styles.headerIcon} key={index}><Icon size={23} strokeWidth={1.7} /></span>)}
        <span className={styles.avatar} title={ownerName}>{initials}</span>
      </div>
    </header>
    <aside className={styles.sidebar} aria-label="منوی مدیریت کسب‌وکار">
      {navigation.map(({ icon: Icon, label: title, href }) => href
        ? <Link key={title} href={href} title={title} aria-label={title} aria-current={activePage === href ? 'page' : undefined} className={activePage === href ? styles.activeNav : styles.navIcon}><Icon size={25} strokeWidth={1.65} /></Link>
        : Icon === BookOpen
          ? <button key={title} type="button" title={title} aria-label={title} aria-expanded={catalogOpen} aria-controls="business-catalog-panel" className={`${styles.navIcon} ${styles.catalogTrigger} ${catalogOpen || activePage.startsWith('/catalogue/') ? styles.activeNav : ''}`} onClick={() => { setCatalogOpen(open => !open); setTeamOpen(false); }}><Icon size={25} strokeWidth={1.65} /></button>
          : Icon === UsersRound
          ? <button key={title} type="button" title={title} aria-label={title} aria-expanded={teamOpen} aria-controls="business-team-panel" className={`${styles.navIcon} ${styles.catalogTrigger} ${teamOpen || activePage === '/team/team-members' ? styles.activeNav : ''}`} onClick={() => { setTeamOpen(open => !open); setCatalogOpen(false); }}><Icon size={25} strokeWidth={1.65} /></button>
          : <span key={title} title={title} aria-label={title} className={styles.navIcon}><Icon size={25} strokeWidth={1.65} /></span>)}
      <span className={styles.help} title="راهنما"><CircleHelp size={24} /></span>
    </aside>
    <div className={styles.workspaceBody}>
      {teamOpen && <aside id="business-team-panel" className={styles.catalogPanel} aria-label="منوی تیم">
        <button type="button" className={styles.catalogCollapse} onClick={() => setTeamOpen(false)} aria-label="بستن منوی تیم"><ChevronLeft size={18} /></button>
        <div className={styles.catalogSections}>
          <section className={styles.catalogGroup}>
            <h2>تیم</h2>
            <ul><li><Link href="/team/team-members" aria-current={activePage === '/team/team-members' ? 'page' : undefined} className={styles.catalogLink}>اعضای تیم</Link></li>{['شیفت‌های برنامه‌ریزی‌شده', 'برگه‌های ساعات کاری', 'پرداخت حقوق'].map(item => <li key={item}>{item}</li>)}</ul>
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

