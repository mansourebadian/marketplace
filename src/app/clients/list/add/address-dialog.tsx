'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { BriefcaseBusiness, Ellipsis, House, MapPin, X } from 'lucide-react';
import styles from './address-dialog.module.css';

export type AddressDraft = { name: string; address: string; apartment: string; district: string; city: string; region: string; postalCode: string };
const types = [{ label: 'خانه', icon: House }, { label: 'محل کار', icon: BriefcaseBusiness }, { label: 'سایر', icon: Ellipsis }];

export function AddressDialog({ onClose, onContinue }: { onClose: () => void; onContinue: (address: AddressDraft) => void }) {
  const [type, setType] = useState('خانه');
  const [name, setName] = useState('خانه');
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handle = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('keydown', handle); previous?.focus(); };
  }, [onClose]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const form = new FormData(event.currentTarget);
    const read = (key: string) => String(form.get(key) || '').trim();
    const address = read('address');
    if (!name.trim() || !address) return;
    onContinue({ name: name.trim(), address, apartment: read('apartment'), district: read('district'), city: read('city'), region: read('region'), postalCode: read('postalCode') });
  };

  return createPortal(<div className={styles.overlay} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <form className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="new-address-title" onSubmit={submit}>
      <button ref={closeRef} type="button" className={styles.close} aria-label="بستن پنجره آدرس" onClick={onClose}><X size={22} /></button>
      <div className={styles.body}><h2 id="new-address-title">آدرس جدید</h2>
        <div className={styles.types} aria-label="نوع آدرس">{types.map(({ label, icon: Icon }) => <button key={label} type="button" aria-pressed={type === label} className={styles.type} onClick={() => { setType(label); setName(label); }}><Icon size={22} /><span>{label}</span></button>)}</div>
        <label className={styles.field}>نام آدرس<input value={name} onChange={event => setName(event.target.value)} maxLength={100} required /></label>
        <label className={styles.field}>آدرس<div className={styles.addressInput}><MapPin size={18} /><input name="address" placeholder="نشانی را وارد کنید" maxLength={300} required /></div></label>
        <div className={styles.details}>
          <p>جزئیات آدرس</p>
          <label>پلاک، طبقه یا واحد<input name="apartment" placeholder="افزودن" maxLength={100} /></label>
          <label>محله<input name="district" placeholder="افزودن" maxLength={100} /></label>
          <label>شهر<input name="city" placeholder="افزودن" maxLength={100} /></label>
          <label>استان<input name="region" placeholder="افزودن" maxLength={100} /></label>
          <label>کد پستی<input name="postalCode" placeholder="افزودن" maxLength={20} inputMode="numeric" /></label>
        </div>
      </div>
      <footer className={styles.footer}><button type="button" className={styles.cancel} onClick={onClose}>انصراف</button><button type="submit" className={styles.continue}>ادامه</button></footer>
    </form>
  </div>, document.body);
}
