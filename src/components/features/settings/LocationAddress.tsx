'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import styles from './LocationAddress.module.css';
export function LocationAddress({ initialAddress, initialMobile = false }: { initialAddress: string; initialMobile?: boolean }) {
 const [address,setAddress]=useState(initialAddress); const [mobile,setMobile]=useState(initialMobile); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError(''); if(!mobile&&!address.trim()){setError('آدرس کسب‌وکار را وارد کنید.');return;}setSaving(true);try{const response=await fetch('/api/business/location/address',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:address.trim(),noFixedAddress:mobile})});if(!response.ok)throw new Error();window.location.assign('/setup/location/new/working-hours');}catch{setError('ذخیرهٔ آدرس انجام نشد. دوباره تلاش کنید.');setSaving(false);}}
 return <main dir="rtl" className={styles.page}><div className={styles.progress} aria-label="مرحلهٔ سوم از چهار مرحله"><span/><span/><span/><i/></div><form onSubmit={submit}><header className={styles.toolbar}><Link className={styles.back} aria-label="بازگشت به دسته‌بندی‌ها" href="/setup/location/new/business-type"><ArrowRight size={20}/></Link><div className={styles.buttons}><Link href="/setup/business-setup/locations" className={styles.close}>بستن</Link><button disabled={saving} className={styles.continue}>{saving?'در حال ذخیره…':'ادامه'}</button></div></header><section className={styles.content}><p className={styles.eyebrow}>افزودن موقعیت جدید</p><h1>موقعیت خود را اضافه کنید</h1><h2>موقعیت کسب‌وکار</h2><label className={styles.checkbox}><input type="checkbox" checked={mobile} onChange={e=>setMobile(e.target.checked)}/><span>آدرس ثابت ندارم (فقط خدمات سیار و آنلاین ارائه می‌دهم)</span></label>{!mobile&&<label className={styles.field}><strong>کسب‌وکار شما کجا قرار دارد؟</strong><div className={styles.inputWrap}><MapPin size={19}/><input maxLength={300} value={address} onChange={e=>setAddress(e.target.value)} required autoComplete="street-address" aria-label="آدرس کسب‌وکار"/></div></label>}{error&&<p role="alert" className={styles.error}>{error}</p>}</section></form></main>;
}


