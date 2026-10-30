'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import styles from './TreatmentTypePicker.module.css';

type Treatment = { id: string; groupSlug: string; groupName: string; name: string };

export function TreatmentTypePicker() {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Treatment[]>([]);
  const [selected, setSelected] = useState<Treatment | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(-1);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return term ? items.filter(item => `${item.name} ${item.groupName}`.toLocaleLowerCase().includes(term)) : items;
  }, [items, query]);
  const grouped = useMemo(() => {
    const groups: { slug: string; name: string; options: { item: Treatment; index: number }[] }[] = [];
    filtered.forEach((item, index) => {
      let group = groups.find(entry => entry.slug === item.groupSlug);
      if (!group) { group = { slug: item.groupSlug, name: item.groupName, options: [] }; groups.push(group); }
      group.options.push({ item, index });
    });
    return groups;
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, id, open]);

  async function openPicker(force = false) {
    if (open && !force) return;
    setOpen(true);
    setQuery('');
    setActive(-1);
    setError('');
    setLoading(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch('/api/business/treatment-types', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('request failed');
      const body = await response.json();
      if (!Array.isArray(body.data)) throw new Error('invalid response');
      setItems(body.data);
    } catch {
      if (!controller.signal.aborted) { setItems([]); setError('دریافت انواع خدمت انجام نشد. دوباره تلاش کنید.'); }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function choose(item: Treatment) { setSelected(item); setOpen(false); setQuery(''); setActive(-1); inputRef.current?.focus(); }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { void openPicker(); return; }
      if (filtered.length) setActive(current => event.key === 'ArrowDown' ? Math.min(current + 1, filtered.length - 1) : current <= 0 ? 0 : current - 1);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (active >= 0 && filtered[active]) choose(filtered[active]);
    }
  }

  return <div className={styles.field} ref={rootRef}>
    <label htmlFor={`${id}-input`}>نوع خدمت <small>(اختیاری)</small></label>
    <input type="hidden" name="treatmentTypeId" value={selected?.id || ''} />
    <div className={styles.control}>
      <input ref={inputRef} id={`${id}-input`} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined} autoComplete="off" placeholder="انتخاب یا جست‌وجوی نوع خدمت" value={open ? query : selected?.name || ''} onClick={() => { void openPicker(); }} onKeyDown={onKeyDown} onChange={event => { if (!open) void openPicker(); setQuery(event.target.value); setActive(-1); }} />
      {selected && !open && <button type="button" className={styles.iconButton} aria-label="پاک کردن نوع خدمت" onClick={() => { setSelected(null); inputRef.current?.focus(); }}><X size={17} /></button>}
      <button type="button" className={styles.iconButton} aria-label={open ? 'بستن فهرست انواع خدمت' : 'باز کردن فهرست انواع خدمت'} tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => { if (open) setOpen(false); else { inputRef.current?.focus(); void openPicker(); } }}><ChevronDown size={18} /></button>
    </div>
    {open && <div className={styles.popup}>
      {loading ? <p role="status" className={styles.message}>در حال دریافت انواع خدمت…</p> : error ? <div className={styles.message} role="alert">{error} <button type="button" onClick={() => { void openPicker(true); inputRef.current?.focus(); }}>تلاش دوباره</button></div> : <ul id={`${id}-list`} role="listbox" aria-label="انواع خدمت" className={styles.list}>
        {grouped.map(group => <li key={group.slug} role="presentation"><div className={styles.groupTitle} id={`${id}-group-${group.slug}`}>{group.name}</div><ul role="group" aria-labelledby={`${id}-group-${group.slug}`}>{group.options.map(({ item, index }) => <li id={`${id}-option-${index}`} key={item.id} role="option" aria-selected={selected?.id === item.id} className={`${styles.option} ${active === index ? styles.active : ''}`} onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => choose(item)}><span dir="auto">{item.name}</span>{selected?.id === item.id && <Check size={17} aria-hidden="true" />}</li>)}</ul></li>)}
        {!filtered.length && <li role="presentation" className={styles.message}>نوع خدمتی پیدا نشد.</li>}
      </ul>}
    </div>}
    <small>به مشتریان کمک می‌کند خدمت شما را در بازار فرشا پیدا کنند.</small>
  </div>;
}
