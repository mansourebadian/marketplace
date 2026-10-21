'use client';

import Link from 'next/link';
import { useActionState, useLayoutEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { updateBusinessDetails, type BusinessDetailsEditState } from '@/actions/business-details.actions';
import styles from './BusinessDetailsEdit.module.css';

const initialState: BusinessDetailsEditState = { status: 'idle' };
function RubikaIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#18c9b4" d="m12 1 9.5 5.5v11L12 23 2.5 17.5v-11z"/><path fill="#f7c845" d="m12 4 6.9 4v8L12 20l-6.9-4V8z"/><path fill="#ef6e43" d="m12 7 4.3 2.5v5L12 17l-4.3-2.5v-5z"/></svg>; }
function BaleIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#12b886"/><path d="m6.5 12 3.5 3.5 7.5-7" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function InstagramIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ffad32"/><stop offset=".5" stopColor="#e63780"/><stop offset="1" stopColor="#7048c7"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)"/><rect x="6.5" y="6.5" width="11" height="11" rx="3.5" fill="none" stroke="white" strokeWidth="1.8"/><circle cx="12" cy="12" r="2.7" fill="none" stroke="white" strokeWidth="1.8"/><circle cx="16.2" cy="7.8" r="1" fill="white"/></svg>; }


export function BusinessDetailsEdit({ initialName, initialWebsite, initialTaxMode, initialTeamLanguage, initialClientLanguage, initialRubika, initialInstagram, initialBale }: { initialName: string; initialWebsite: string; initialTaxMode: string; initialTeamLanguage: string; initialClientLanguage: string; initialRubika: string; initialInstagram: string; initialBale: string }) {
  const [state, action, pending] = useActionState(updateBusinessDetails, initialState);
  const [languageTarget, setLanguageTarget] = useState<'team' | 'client' | null>(null);
  const [teamLanguage, setTeamLanguage] = useState(initialTeamLanguage);
  const [clientLanguage, setClientLanguage] = useState(initialClientLanguage);
  const languages = ['فارسی', 'ترکی', 'عربی', 'اردو', 'پشتو', 'کردی'];
  useLayoutEffect(() => {
    const scrollToHash = () => {
      if (window.location.hash !== '#external-links' && !window.location.search.includes('section=external-links')) return;
      const target = document.getElementById('external-links');
      if (!target) return;
      const top = target.getBoundingClientRect().top + (document.scrollingElement?.scrollTop ?? window.scrollY) - 24;
      const scrollRoot = document.scrollingElement;
      if (scrollRoot) scrollRoot.scrollTo({ top, behavior: 'auto' });
      window.scrollTo({ top, behavior: 'auto' });
    };
    const frame = window.requestAnimationFrame(scrollToHash);
    const timer = window.setTimeout(scrollToHash, 180);
    const timer2 = window.setTimeout(scrollToHash, 700);
    window.addEventListener('hashchange', scrollToHash);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); window.clearTimeout(timer2); window.removeEventListener('hashchange', scrollToHash); };
  }, []);
  return <div className={styles.page} dir="rtl">
    <header className={styles.actions}><Link href="/setup/business-setup/business-details" className={styles.close}>بستن</Link><button form="business-details-edit" type="submit" className={styles.save} disabled={pending}>{pending ? 'در حال ذخیره…' : 'ذخیره'}</button></header>
    <main className={styles.main}><h1>ویرایش جزئیات کسب‌وکار</h1>
      <form id="business-details-edit" action={action}>
        <section className={styles.card}><h2>اطلاعات کسب‌وکار</h2><p>نامی را انتخاب کنید که در پروفایل رزرو آنلاین، رسیدهای فروش و پیام‌های مشتریان نمایش داده می‌شود.</p><label htmlFor="businessName">نام کسب‌وکار</label><input id="businessName" name="businessName" defaultValue={initialName} autoFocus /><div className={styles.notice}>کشور شما روی <strong>ایران</strong> با واحد پول <strong>ریال</strong> تنظیم شده است.</div></section>
        <section className={styles.card}><h2>محاسبهٔ مالیات</h2><p>مشخص کنید مالیات چگونه روی قیمت خدمات و گزارش‌ها اعمال شود.</p><label className={styles.radio}><input type="radio" name="taxMode" defaultChecked={initialTaxMode === 'include'} value="include" /> <span><strong>قیمت‌ها شامل مالیات هستند</strong><small>مالیات در مبلغ نهایی لحاظ می‌شود.</small></span></label><label className={styles.radio}><input type="radio" name="taxMode" defaultChecked={initialTaxMode === 'exclude'} value="exclude" /> <span><strong>قیمت‌ها بدون مالیات هستند</strong><small>مالیات هنگام محاسبه به قیمت اضافه می‌شود.</small></span></label></section>
        <section className={styles.card}><h2>تنظیمات زبان</h2><p>زبان پیش‌فرض مشتریان و اعضای تیم را انتخاب کنید.</p><input type="hidden" name="teamLanguage" value={teamLanguage} /><input type="hidden" name="clientLanguage" value={clientLanguage} /><div className={styles.languageGrid}><label>زبان پیش‌فرض تیم<div className={styles.languageValue}>{teamLanguage} <button type="button" onClick={() => setLanguageTarget('team')}>ویرایش</button></div></label><label>زبان پیش‌فرض مشتریان<div className={styles.languageValue}>{clientLanguage} <button type="button" onClick={() => setLanguageTarget('client')}>ویرایش</button></div></label></div><div className={styles.notice}>اعضای تیم و مشتریان می‌توانند زبان نمایش‌داده‌شده را در تنظیمات خود تغییر دهند.</div></section>
        <section className={styles.card}><h2>لینک‌های بیرونی</h2><p>وب‌سایت و لینک‌های شبکه‌های اجتماعی کسب‌وکارتان را برای اشتراک‌گذاری با مشتریان اضافه کنید.</p><div className={styles.externalFields}><label>روبیکا<div className={styles.inputWithIcon}><RubikaIcon /><input name="rubika" defaultValue={initialRubika} placeholder="rubika.ir/yourpage" /></div></label><label>اینستاگرام<div className={styles.inputWithIcon}><InstagramIcon /><input name="instagram" defaultValue={initialInstagram} placeholder="instagram.com/yoursite" /></div></label><label>بله<div className={styles.inputWithIcon}><BaleIcon /><input name="bale" defaultValue={initialBale} placeholder="bale.ai/yourpage" /></div></label><label>وب‌سایت<div className={styles.inputWithIcon}><Globe2 size={18} /><input name="website" defaultValue={initialWebsite} placeholder="yoursite.com" /></div></label></div></section>
        {state.message && <p className={styles.error}>{state.message}</p>}
      </form>
    </main>
    {languageTarget && <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setLanguageTarget(null); }}><section className={styles.languageModal} role="dialog" aria-modal="true" aria-labelledby="language-title"><button type="button" className={styles.modalClose} onClick={() => setLanguageTarget(null)} aria-label="بستن">×</button><h2 id="language-title">تغییر زبان</h2><h3>زبان‌های موجود</h3><div className={styles.languageOptions}>{languages.map(language => { const selected = (languageTarget === 'team' ? teamLanguage : clientLanguage) === language; return <button type="button" key={language} className={selected ? styles.languageOptionSelected : styles.languageOption} onClick={() => { if (languageTarget === 'team') setTeamLanguage(language); else setClientLanguage(language); setLanguageTarget(null); }}><strong>{language}</strong><span>{language === 'فارسی' ? 'ایران' : language}</span></button>; })}</div></section></div>}
  </div>;
}

