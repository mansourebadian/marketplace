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
export function LocationsPage({ ownerName, businessName, address, location }: { ownerName: string; businessName: string; address: string | null; location: string | null }) {
  const data = locationData(location); const [optionsOpen, setOptionsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  return <BusinessWorkspace ownerName={ownerName} activePage="/setup" label="موقعیت‌ها">
    <div className={styles.scroll}><div className={styles.container}>
      <nav className={styles.breadcrumb}><Link className={styles.back} href="/setup/business-setup/business-details"><ArrowLeft size={17} /> بازگشت</Link><Link href="/setup">تنظیمات فضای کاری</Link><span>·</span><span>راه‌اندازی کسب‌وکار</span></nav>
      <div className={styles.layout}>
        <aside className={styles.menu}><h2>راه‌اندازی کسب‌وکار</h2><nav><Link href="/setup/business-setup/business-details">جزئیات کسب‌وکار</Link><Link href="/setup/business-setup/locations" aria-current="page">موقعیت‌ها</Link>{['منوی خدمات','فهرست محصولات','اشتراک‌ها','پکیج‌ها','فهرست مشتریان'].map(item => <a href="#" className={styles.external} key={item}><ArrowUpRight size={16}/>{item}</a>)}</nav></aside>
        <main className={styles.main}><div className={styles.titleRow}><div><h1>موقعیت‌ها</h1><p>اطلاعات و ترجیحات موقعیت‌های کسب‌وکار خود را مدیریت کنید.</p><a href="#learn">بیشتر بدانید</a></div><div className={styles.toolbar}><div className={styles.dropdownWrap}><button className={styles.lightButton} onClick={() => setOptionsOpen(!optionsOpen)}>گزینه‌ها <ChevronDown size={16}/></button>{optionsOpen && <div className={styles.dropdown}><button>خروجی گرفتن</button><button>تنظیمات موقعیت‌ها</button></div>}</div><Link href="/setup/location/new/basic-info" className={styles.add}><Plus size={17}/> افزودن</Link></div></div>
          <article className={styles.locationCard}><div className={styles.iconPanel}><Store size={54} strokeWidth={1.3}/></div><div className={styles.cardBody}><h2>{data.name || businessName}</h2><p className={styles.muted}>هنوز نظری ثبت نشده</p><p>{data.address || data.city || addressText(address)}</p><p>{data.country || "ایران"}</p><div className={styles.dropdownWrap}><button className={styles.actionButton} onClick={() => setActionsOpen(!actionsOpen)}>عملیات <ChevronDown size={16}/></button>{actionsOpen && <div className={styles.dropdown}><button>ویرایش موقعیت</button><button>غیرفعال کردن</button></div>}</div></div></article>
        </main>
      </div>
    </div></div>
  </BusinessWorkspace>;
}




