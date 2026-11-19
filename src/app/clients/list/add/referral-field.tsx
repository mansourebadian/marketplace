'use client';

import { useEffect, useRef, useState } from 'react';
import { Gem, Search, UserRound, X } from 'lucide-react';
import styles from './referral-field.module.css';

type Customer = { id: string; name: string; email: string; phone: string | null };

export function ReferralField({ customers }: { customers: Customer[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  const term = query.trim().toLocaleLowerCase('fa');
  const filtered = customers.filter(customer => [customer.name, customer.email, customer.phone || ''].some(value => value.toLocaleLowerCase('fa').includes(term)));

  return <div className={styles.field}>
    <span id="referral-label" className={styles.label}>معرف مشتری</span>
    <input type="hidden" name="referralId" value={selected?.id || ''} />
    <button ref={triggerRef} type="button" aria-labelledby="referral-label referral-value" aria-haspopup="dialog" className={styles.trigger} onClick={() => { setQuery(''); setOpen(true); }}><UserRound size={20} /><span id="referral-value">{selected?.name || 'انتخاب مشتری'}</span><strong>{selected ? 'تغییر' : 'افزودن'}</strong></button>
    <small>مشتری معرف را از میان مشتریان این کسب‌وکار انتخاب کنید.</small>
    {open && <div className={styles.overlay} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="referral-title" aria-describedby="referral-description">
      <button type="button" className={styles.close} aria-label="بستن انتخاب معرف" onClick={close}><X size={22} /></button>
      <h2 id="referral-title">افزودن معرف</h2><p id="referral-description" className={styles.description}>مشتری موردنظر را برای انتخاب به‌عنوان معرف جست‌وجو کنید.</p>
      <div className={styles.banner}><div><strong>با مشتریان وفادار خود، مشتریان جدید جذب کنید</strong><span>معرف مشتری را از فهرست زیر انتخاب کنید.</span></div><Gem size={52} strokeWidth={1.4} aria-hidden="true" /></div>
      <label className={styles.search}><Search size={19} /><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="نام، ایمیل یا شماره تلفن" aria-label="جست‌وجوی مشتری معرف" /></label>
      <div className={styles.list}>{filtered.map(customer => <button type="button" key={customer.id} className={styles.customer} onClick={() => { setSelected(customer); close(); }}><span className={styles.avatar}>{customer.name.trim().charAt(0).toUpperCase()}</span><span className={styles.details}><strong>{customer.name}</strong>{(customer.email || customer.phone) && <span dir="auto">{customer.email || customer.phone}</span>}</span></button>)}{!filtered.length && <p className={styles.empty}>{term ? 'مشتری با این مشخصات پیدا نشد.' : 'هنوز مشتری‌ای با سابقه نوبت در این کسب‌وکار وجود ندارد.'}</p>}</div>
      {selected && <button type="button" className={styles.clear} onClick={() => { setSelected(null); close(); }}>حذف معرف انتخاب‌شده</button>}
    </div></div>}
  </div>;
}
