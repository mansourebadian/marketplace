'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import * as CategoryIcons from 'lucide-react';
import { ArrowLeft, Heart, Scissors, Sparkles, Dumbbell, PawPrint, Grid2X2 } from 'lucide-react';
import styles from '@/components/features/settings/BusinessTypePage.module.css';
const categories = [{n:'سالن مو',i:Scissors},{n:'ناخن',i:Sparkles},{n:'ابرو و مژه',i:Heart},{n:'سالن زیبایی',i:Sparkles},{n:'مد اسپا',i:Sparkles},{n:'آرایشگاه مردانه',i:Scissors},{n:'ماساژ',i:Heart},{n:'اسپا و سونا',i:Sparkles},{n:'سالن اپیلاسیون',i:Sparkles},{n:'تاتو و پیرسینگ',i:Heart},{n:'استودیو برنزه',i:Sparkles},{n:'تناسب اندام و ریکاوری',i:Dumbbell},{n:'فیزیوتراپی',i:Heart},{n:'مرکز سلامت',i:PlusIcon},{n:'آرایش حیوانات',i:PawPrint},{n:'سایر',i:Grid2X2}];
function PlusIcon(){return <span>＋</span>}
export default function BusinessTypePage({ initialSelected = [] }: { initialSelected?: string[] }){const [items,setItems]=useState(categories); useEffect(()=>{fetch('/api/business-categories').then(r=>r.json()).then(data=>{if(Array.isArray(data.categories)&&data.categories.length){const next=data.categories.map((c:any,i:number)=>({n:c.label,slug:c.slug,i:(CategoryIcons as any)[c.icon] || Grid2X2})); setItems(next); setSelected((data.selected||[]).map((slug:string)=>next.findIndex((c:any)=>c.slug===slug)).filter((i:number)=>i>=0));}})},[]); const [selected,setSelected]=useState<number[]>(initialSelected.map(slug => items.findIndex(c => c.n === slug)).filter(i => i >= 0)); const toggle=(index:number)=>setSelected(v=>v.includes(index)?v.filter(x=>x!==index):v.length<4?[...v,index]:v); return <main className={styles.page} dir="rtl"><div className={styles.progress}><span/><span/><i/><i/></div><header><Link href="/setup/location/new/basic-info" className={styles.back}><ArrowLeft size={20}/></Link><div><Link href="/setup/business-setup/locations" className={styles.close}>بستن</Link><button className={styles.continue} disabled={!selected.length} onClick={async()=>{const slugs=selected.map(i=>(items[i] as any).slug).filter(Boolean); const response=await fetch('/api/business-categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slugs})}); if(response.ok) window.location.assign('/setup/location/new/address');}}>ادامه</button></div></header><section className={styles.form}><p className={styles.eyebrow}>افزودن موقعیت جدید</p><h1>دسته‌بندی‌هایی را انتخاب کنید که کسب‌وکار شما را بهتر توصیف می‌کنند</h1><p className={styles.subtitle}>دستهٔ اصلی و حداکثر ۳ نوع خدمات مرتبط را انتخاب کنید</p><div className={styles.grid}>{items.map(({n,i:Icon},index)=><button type="button" key={n} className={`${styles.card} ${selected.includes(index)?styles.selected:''}`} onClick={()=>toggle(index)}><Icon size={27}/><strong>{n}</strong>{selected.includes(index)&&<span className={styles.badge}>{selected[0]===index?'اصلی':selected.indexOf(index)+1}</span>}</button>)}</div></section></main>}







