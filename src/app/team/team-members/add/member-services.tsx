'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import styles from './team-member-form.module.css';

type Service = { id: string; categoryKey: string; name: string; price: number; priceType: string; durationMin: number };
type Data = { services: Service[]; names: Record<string, string>; selected: string[] };

function Checkbox({ checked, partial, onChange, label }: { checked: boolean; partial?: boolean; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!partial; }, [partial]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={onChange} />;
}

export function MemberServices({ memberId, onSavingChange }: { memberId: string; onSavingChange: (saving: boolean) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/team/members/${encodeURIComponent(memberId)}/services`, { signal: controller.signal }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result); setSelected(result.selected); }).catch(reason => { if (!controller.signal.aborted) setError(reason.message || 'دریافت خدمات انجام نشد.'); });
    return () => controller.abort();
  }, [memberId]);
  const toggle = (ids: string[]) => { setSaved(false); setSelected(current => { const all = ids.every(id => current.includes(id)); return all ? current.filter(id => !ids.includes(id)) : [...new Set([...current, ...ids])]; }); };
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!data) return; onSavingChange(true); setError(''); setSaved(false); try { const response = await fetch(`/api/team/members/${encodeURIComponent(memberId)}/services`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceIds: selected }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setSaved(true); } catch (reason) { setError(reason instanceof Error ? reason.message : 'ذخیره خدمات انجام نشد.'); } finally { onSavingChange(false); } };
  const visible = data?.services.filter(service => service.name.toLocaleLowerCase('fa').includes(query.trim().toLocaleLowerCase('fa'))) || [];
  const groups = [...new Set(visible.map(service => service.categoryKey))];
  return <form id="member-services-form" className={styles.form} onSubmit={submit}>
    <h2>خدمات</h2><p className={styles.subtitle}>خدماتی را که این عضو تیم ارائه می‌دهد انتخاب کنید</p>
    <label className={styles.serviceSearch}><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی خدمات" aria-label="جستجوی خدمات" /></label>
    {error && <p className={styles.serviceError} role="alert">{error}</p>}{saved && <p className={styles.serviceSaved} role="status">خدمات ذخیره شدند.</p>}
    {!data && !error && <p>در حال دریافت خدمات…</p>}
    {data && data.services.length === 0 && <p className={styles.serviceEmpty}>هنوز خدمتی در فهرست کسب‌وکار ثبت نشده است.</p>}
    {data && data.services.length > 0 && <><label className={styles.serviceAll}><Checkbox checked={selected.length === data.services.length} partial={selected.length > 0 && selected.length < data.services.length} onChange={() => toggle(data.services.map(item => item.id))} label="انتخاب همه خدمات" /><strong>همه خدمات</strong><span className={styles.serviceCount}>{data.services.length.toLocaleString('fa-IR')}</span></label>
      {groups.map(key => { const group = visible.filter(item => item.categoryKey === key); const groupAll = data.services.filter(item => item.categoryKey === key); const count = groupAll.filter(item => selected.includes(item.id)).length; return <section className={styles.serviceGroup} key={key}><label className={styles.serviceGroupHeader}><Checkbox checked={count === groupAll.length} partial={count > 0 && count < groupAll.length} onChange={() => toggle(groupAll.map(item => item.id))} label={`انتخاب دسته ${data.names[key] || 'سایر خدمات'}`} /><strong>{data.names[key] || 'سایر خدمات'}</strong><span className={styles.serviceCount}>{groupAll.length.toLocaleString('fa-IR')}</span></label>
        {group.map(service => <label className={styles.serviceRow} key={service.id}><Checkbox checked={selected.includes(service.id)} onChange={() => toggle([service.id])} label={`انتخاب ${service.name}`} /><span className={styles.serviceName}><strong>{service.name}</strong><small>{service.durationMin.toLocaleString('fa-IR')} دقیقه</small></span><span>{service.priceType === 'FREE' ? 'رایگان' : `${service.priceType === 'STARTS_AT' ? 'از ' : ''}${service.price.toLocaleString('fa-IR')} تومان`}</span></label>)}</section>; })}
      {!visible.length && <p className={styles.serviceEmpty}>خدمتی با این نام پیدا نشد.</p>}</>}
  </form>;
}
