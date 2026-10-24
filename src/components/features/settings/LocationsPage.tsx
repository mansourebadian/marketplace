'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ChevronDown, MapPin, MoreHorizontal, Plus, Store } from 'lucide-react';
import { BusinessWorkspace } from '../calendar/BusinessWorkspace';
import styles from './LocationsPage.module.css';

function locationData(raw: string | null) { try { const value = JSON.parse(raw || '{}'); return value && typeof value === 'object' ? value as Record<string, string> : {}; } catch { return {}; } }
function addressText(raw: string | null) {
  try { const value = JSON.parse(raw || '{}'); return [value.address, value.city, value.country].filter(Boolean).join(', ') || 'آدرس ثبت نشده'; } catch { return raw || 'آدرس ثبت نشده'; }
}
export function LocationsPage({ ownerName, businessName, address, location, locations = [] }: { ownerName: string; businessName: string; address: string | null; location: string | null; locations?: Array<{ id: string; name: string; address: string | null }> }) {
  const data = locationData(location); const [optionsOpen, setOptionsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null); const [items, setItems] = useState(locations); const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  return <BusinessWorkspace ownerName={ownerName} activePage="/setup" label="موقعیت‌ها">
    <div className={styles.scroll}><div className={styles.container}>
      <nav className={styles.breadcrumb}><Link className={styles.back} href="/setup/business-setup/business-details"><ArrowLeft size={17} /> بازگشت</Link><Link href="/setup">تنظیمات فضای کاری</Link><span>·</span><span>راه‌اندازی کسب‌وکار</span></nav>
      <div className={styles.layout}>
        <aside className={styles.menu}><h2>راه‌اندازی کسب‌وکار</h2><nav><Link href="/setup/business-setup/business-details">جزئیات کسب‌وکار</Link><Link href="/setup/business-setup/locations" aria-current="page">موقعیت‌ها</Link>{['منوی خدمات','فهرست محصولات','اشتراک‌ها','پکیج‌ها','فهرست مشتریان'].map(item => <a href="#" className={styles.external} key={item}><ArrowUpRight size={16}/>{item}</a>)}</nav></aside>
        <main className={styles.main}><div className={styles.titleRow}><div><h1>موقعیت‌ها</h1><p>اطلاعات و ترجیحات موقعیت‌های کسب‌وکار خود را مدیریت کنید.</p><a href="#learn">بیشتر بدانید</a></div><div className={styles.toolbar}><div className={styles.dropdownWrap}><button className={styles.lightButton} onClick={() => setOptionsOpen(!optionsOpen)}>گزینه‌ها <ChevronDown size={16}/></button>{optionsOpen && <div className={styles.dropdown}><button>خروجی گرفتن</button><button>تنظیمات موقعیت‌ها</button></div>}</div><Link href="/setup/location/new/basic-info" className={styles.add}><Plus size={17}/> افزودن</Link></div></div>
          {(items.length ? items : [{ id: "legacy", name: data.name || businessName, address: data.address || addressText(address) }]).map((item) => <article className={styles.locationCard} key={item.id}><div className={styles.iconPanel}><Store size={54} strokeWidth={1.3}/></div><div className={styles.cardBody}><h2>{item.name}</h2><p className={styles.muted}>هنوز نظری ثبت نشده</p><p>{item.address || addressText(address)}</p><p>{data.country || "ایران"}</p><div className={styles.dropdownWrap}><button className={styles.actionButton} onClick={() => setActionsOpen(actionsOpen === item.id ? null : item.id)}>عملیات <ChevronDown size={16}/></button>{actionsOpen === item.id && <div className={styles.dropdown}><button className={styles.viewAction}>{"\u0645\u0634\u0627\u0647\u062f\u0647"}</button><button className={styles.deleteAction} onClick={async () => { setDeleteTarget(item.id); return; const response = await fetch(`/api/business/location/${item.id}`, { method: "DELETE" }); if (response.ok) setItems(current => current.filter(location => location.id !== item.id)); }}>{"\u062d\u0630\u0641 \u0645\u0648\u0642\u0639\u06cc\u062a"}</button></div>}</div></div></article>)}
        {deleteTarget && <div className={styles.modalBackdrop} role="presentation"><div className={styles.confirmModal} role="dialog" aria-modal="true"><button className={styles.modalClose} onClick={() => setDeleteTarget(null)} aria-label={"\u0628\u0633\u062a\u0646"}>&#215;</button><h2>{"\u062d\u0630\u0641 \u0645\u0648\u0642\u0639\u06cc\u062a"}</h2><p>{"\u0622\u06cc\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062a\u06cc\u062f \u06a9\u0647 \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u06cc\u062f \u0627\u06cc\u0646 \u0645\u0648\u0642\u0639\u06cc\u062a \u0631\u0627 \u062d\u0630\u0641 \u06a9\u0646\u06cc\u062f\u061f"}</p><div className={styles.modalActions}><button onClick={() => setDeleteTarget(null)}>{"\u0627\u0646\u0635\u0631\u0627\u0641"}</button><button className={styles.confirmDelete} onClick={async () => { const response = await fetch(`/api/business/location/${deleteTarget}`, { method: "DELETE" }); if (response.ok) setItems(current => current.filter(location => location.id !== deleteTarget)); setDeleteTarget(null); }}>{"\u062d\u0630\u0641"}</button></div></div></div>}
        </main>
      </div>
    </div></div>
  </BusinessWorkspace>;
}




