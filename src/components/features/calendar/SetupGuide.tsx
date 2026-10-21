'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Check, ChevronLeft, CircleHelp, CreditCard, Rocket, Sparkles, Star, Store, X } from 'lucide-react';
import styles from './SetupGuide.module.css';

const tabs = [
  { id: 'news', title: 'تازه‌ها', icon: Rocket },
  { id: 'help', title: 'کمک', icon: CircleHelp },
  { id: 'guides', title: 'راهنماها', icon: BookOpen },
] as const;

export function SetupGuide({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<string>('guides');
  return <aside className={styles.drawer} aria-label="مرکز راهنمای فرشا" dir="rtl">
    <button type="button" autoFocus className={styles.close} onClick={onClose} aria-label="بستن راهنما"><X size={22} strokeWidth={1.5} /></button>
    <nav className={styles.tabs} role="tablist" aria-label="مرکز راهنما" aria-orientation="vertical">
      {tabs.map(({ id, title, icon: Icon }) => <button key={id} id={`guide-tab-${id}`} type="button" role="tab" aria-selected={activeTab === id} aria-controls="setup-guide-panel" onClick={() => setActiveTab(id)}><Icon size={21} strokeWidth={1.5} /><span>{title}</span></button>)}
    </nav>
    <div id="setup-guide-panel" role="tabpanel" aria-labelledby={`guide-tab-${activeTab}`} className={styles.panel}>
      {activeTab === 'guides' ? <>
        <header className={styles.hero}><p>در مسیر یادگیری</p><h2>با حساب جدید فرشا آشنا شوید</h2><div className={styles.badges} aria-label="مراحل آشنایی با فرشا">{[Star, Rocket, Store, CreditCard].map((Icon, i) => <span key={i} className={i === 0 ? styles.selectedBadge : undefined} aria-current={i === 0 ? 'step' : undefined} aria-label={['آشنایی با حساب', 'شروع کار', 'کسب‌وکار', 'پرداخت‌ها'][i]}><svg className={styles.hexagon} viewBox="0 0 38 44" aria-hidden="true"><path d="M19 1.5 36.5 11.75v20.5L19 42.5 1.5 32.25v-20.5Z" /></svg><Icon size={20} strokeWidth={1.5} /></span>)}</div></header>
        <div className={styles.body}>
          <div className={styles.video}><Image src="/images/setup-guide-thumbnail.png" alt="معرفی فرشا" fill sizes="(max-width: 700px) 70vw, 416px" /></div>
          <ol className={styles.steps}>{['ایجاد حساب فرشا', 'ایجاد اولین نوبت', 'تسویه‌حساب یک نوبت'].map((title, index) => <li key={title}><button type="button"><span className={styles.number}>{(index + 1).toLocaleString('fa-IR')}</span><span>{title}</span>{index === 0 ? <span className={styles.done} aria-label="تکمیل شده"><Check size={17} /></span> : <ChevronLeft size={18} strokeWidth={1.5} />}</button></li>)}</ol>
          <button type="button" className={styles.skip} onClick={onClose}>رد کردن این راهنما <ArrowLeft size={18} /></button>
          <section className={styles.help}><Sparkles className={styles.helpIcon} size={30} fill="#9a55ff" /><h3>مرکز کمک</h3><p>با مرکز کمک و پایگاه دانش ما یاد بگیرید و رشد کنید.</p><button type="button" onClick={() => setActiveTab('help')}>رفتن به مرکز کمک <ArrowLeft size={18} /></button></section>
        </div>
      </> : <div className={styles.other}><h2>{activeTab === 'news' ? 'تازه‌ها' : 'مرکز کمک'}</h2><p>{activeTab === 'news' ? 'خبرها و امکانات جدید فرشا را اینجا دنبال کنید.' : 'برای شروع کار، راهنمای راه‌اندازی حساب را ببینید.'}</p><button type="button" onClick={() => setActiveTab('guides')}>مشاهدهٔ راهنماها <ArrowLeft size={18} /></button></div>}
    </div>
  </aside>;
}
