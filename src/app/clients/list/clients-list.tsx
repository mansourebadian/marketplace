'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, FileSpreadsheet, FileText, Merge, Search, SlidersHorizontal, Upload, UsersRound, X } from 'lucide-react';
import Link from 'next/link';
import { ClientPhoto } from './client-photo';
import styles from './clients-list.module.css';

type Client = { id: string; name: string; email: string; phone: string | null; createdAt: string; sales: number; hasPhoto: boolean; isManual: boolean };
const number = new Intl.NumberFormat('fa-IR');
const date = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Tehran' });

export function ClientsList({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [bannerVisible, setBannerVisible] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!optionsOpen) return;
    const onOutside = (event: PointerEvent) => { if (!optionsRef.current?.contains(event.target as Node)) setOptionsOpen(false); };
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOptionsOpen(false); optionsButtonRef.current?.focus(); } };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => { document.removeEventListener('pointerdown', onOutside); document.removeEventListener('keydown', onEscape); };
  }, [optionsOpen]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('fa');
    return clients.filter(client => [client.name, client.email, client.phone || ''].some(value => value.toLocaleLowerCase('fa').includes(term))).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'fa') : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
  }, [clients, query, sort]);

  return <div className={styles.page}><div className={styles.container}>
    <header className={styles.heading}><div><h1>فهرست مشتریان <span>{number.format(clients.length)}</span></h1><p>اطلاعات مشتریان کسب‌وکار خود را مشاهده کنید.</p></div><div className={styles.actions}><div className={styles.optionsWrap} ref={optionsRef}><button ref={optionsButtonRef} type="button" className={styles.optionsButton} aria-expanded={optionsOpen} aria-controls="client-options" onClick={() => setOptionsOpen(open => !open)}>گزینه‌ها <ChevronDown size={16} className={optionsOpen ? styles.chevronOpen : undefined} /></button>{optionsOpen && <div id="client-options" className={styles.optionsMenu} aria-label="گزینه‌های مشتریان"><button type="button" disabled title="به‌زودی"><Upload size={18} /> وارد کردن مشتریان</button><button type="button" disabled title="به‌زودی"><Merge size={18} /> ادغام مشتریان</button><div className={styles.optionsDivider} /><strong>دریافت خروجی</strong><button type="button" disabled title="به‌زودی"><FileSpreadsheet size={18} /> Excel</button><button type="button" disabled title="به‌زودی"><FileText size={18} /> CSV</button></div>}</div><Link href="/clients/list/add" className={styles.addButton}>افزودن</Link></div></header>
    {bannerVisible && <section className={styles.banner}><button type="button" className={styles.dismiss} onClick={() => setBannerVisible(false)} aria-label="بستن پیام"><X size={19} /></button><div><h2>فهرست مشتریان خود را مدیریت کنید</h2><p>مشتریان ثبت‌شده و مشتریان دارای سابقهٔ نوبت در این فهرست نمایش داده می‌شوند.</p></div><UsersRound className={styles.bannerIcon} size={84} strokeWidth={1.2} aria-hidden="true" /></section>}
    <div className={styles.toolbar}><label className={styles.search}><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="نام، ایمیل یا شماره تلفن" aria-label="جست‌وجوی مشتری" /></label><button type="button" className={styles.filter} disabled title="به‌زودی"><SlidersHorizontal size={17} /> فیلترها</button><label className={styles.sort}><span className={styles.visuallyHidden}>مرتب‌سازی مشتریان</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="newest">تاریخ ثبت (جدیدترین)</option><option value="oldest">تاریخ ثبت (قدیمی‌ترین)</option><option value="name">نام مشتری</option></select></label></div>
    <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>نام مشتری</th><th>شماره همراه</th><th>دیدگاه‌ها</th><th>فروش</th><th>تاریخ ثبت</th></tr></thead><tbody>{filtered.map(client => <tr key={client.id}><td><div className={styles.person}><ClientPhoto id={client.id} name={client.name} hasPhoto={client.hasPhoto} editable={client.isManual} /><div><strong>{client.name}</strong>{client.email && <span dir="auto">{client.email}</span>}</div></div></td><td><bdi>{client.phone || '—'}</bdi></td><td>—</td><td>{number.format(client.sales)} تومان</td><td>{date.format(new Date(client.createdAt))}</td></tr>)}</tbody></table>{!filtered.length && <div className={styles.empty}>{query ? 'مشتری با این مشخصات پیدا نشد.' : 'هنوز مشتری‌ای برای این کسب‌وکار ثبت نشده است.'}</div>}</div>
    <p className={styles.count}>{number.format(filtered.length)} مشتری نمایش داده می‌شود</p>
  </div></div>;
}
