'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Upload } from 'lucide-react';
import { imageUrl } from '@/lib/image-server';
import shared from '../essentials-overview/essentials.module.css';
import styles from './images.module.css';

const MAX_IMAGES = 10;
const MAX_SIZE = 45 * 1024 * 1024;

function dimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تصویر قابل خواندن نیست.')); };
    image.src = url;
  });
}

export default function ImagesForm({ initialImages }: { initialImages: string[] }) {
  const [images, setImages] = useState(initialImages);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const draggedIndex = useRef<number | null>(null);

  async function upload(files: FileList | File[]) {
    const selected = Array.from(files);
    if (!selected.length || busy) return;
    setError('');
    if (selected.length + images.length > MAX_IMAGES) { setError('حداکثر می‌توانید ۱۰ تصویر بارگذاری کنید.'); return; }
    setBusy(true);
    setProgress({ done: 0, total: selected.length });
    try {
      for (let index = 0; index < selected.length; index++) {
        const file = selected[index];
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_SIZE) throw new Error('فایل باید JPG، PNG یا WebP و حداکثر ۴۵ مگابایت باشد.');
        const size = await dimensions(file);
        if (size.width < 916 || size.height < 500) throw new Error('ابعاد تصویر باید حداقل ۹۱۶ در ۵۰۰ پیکسل باشد.');
        const data = new FormData();
        data.append('image', file);
        const response = await fetch('/api/business/venue-images', { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'بارگذاری تصویر انجام نشد.');
        setImages(previous => [...previous, result.name]);
        setProgress({ done: index + 1, total: selected.length });
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'بارگذاری تصویر انجام نشد.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }

  async function saveOrder(next: string[]) {
    if (busy) return;
    setBusy(true); setError(''); setProgress({ done: 0, total: 0 });
    try {
      const response = await fetch('/api/business/venue-images', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images: next }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ذخیره تصاویر انجام نشد.');
      setImages(next);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'ذخیره تصاویر انجام نشد.'); }
    finally { setBusy(false); }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void saveOrder(next);
  }

  return <main className={shared.page} dir="rtl">
    <header className={`${shared.header} ${styles.header}`}>
      <div className={shared.progress}><span /><span /><span /></div>
      <div className={shared.navigation}>
        <Link className={shared.back} href="/online-presence/marketplace-profile/image-guidelines" aria-label="بازگشت"><ArrowRight size={20} /></Link>
        <div className={shared.actions}>
          <Link className={styles.guide} href="/online-presence/marketplace-profile/image-guidelines">راهنمای تصاویر</Link>
          {busy ? <button type="button" className={shared.close} disabled>ذخیره و خروج</button> : <Link className={shared.close} href="/online-presence/marketplace-profile">ذخیره و خروج</Link>}
          {busy || images.length === 0 ? <button className={shared.continue} type="button" disabled>ادامه <ArrowLeft size={20} /></button> : <Link className={shared.continue} href="/online-presence/marketplace-profile/features">ادامه <ArrowLeft size={20} /></Link>}
        </div>
      </div>
    </header>
    <section className={styles.content}>
      <h1>تصاویر کسب‌وکار خود را به‌روزرسانی کنید</h1>
      <p className={styles.description}>حداقل ۳ تصویر از محل کسب‌وکار خود اضافه کنید. می‌توانید تا ۱۰ تصویر بارگذاری کنید و با کشیدن تصاویر ترتیب آن‌ها را تغییر دهید.</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { if (event.target.files) void upload(event.target.files); }} />
      <div className={`${styles.drop} ${images.length ? styles.compact : ''} ${dragging ? styles.dragging : ''}`} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) void upload(event.dataTransfer.files); }}>
        {busy && progress.total > 0 ? <div className={styles.uploading} role="status">در حال بارگذاری تصاویر... <div className={styles.track}><span style={{ width: `${Math.max(4, progress.done / progress.total * 100)}%` }} /></div></div> : <div className={styles.dropInner}><Upload size={27} strokeWidth={1.7} /><strong>تصاویر خود را اینجا بکشید و رها کنید</strong><span>یا برای انتخاب فایل کلیک کنید</span><button type="button" onClick={() => input.current?.click()} disabled={busy || images.length >= MAX_IMAGES}>انتخاب فایل</button></div>}
      </div>
      <p className={styles.hint}>فرمت JPG، PNG، WebP · حداقل ابعاد ۹۱۶ × ۵۰۰ پیکسل · حداکثر حجم ۴۵ مگابایت</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {images.length > 0 && <div className={styles.gallery}>
        {images.map((name, index) => <div key={name} className={`${styles.tile} ${index === 0 ? styles.cover : ''}`} draggable={!busy} onDragStart={() => { draggedIndex.current = index; }} onDragEnd={() => { draggedIndex.current = null; }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (draggedIndex.current !== null) move(draggedIndex.current, index); draggedIndex.current = null; }}>
          {/* The image server is configured independently of the Next.js host. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(name)} alt={index === 0 ? 'تصویر اصلی کسب‌وکار' : `تصویر ${index + 1} کسب‌وکار`} />
          {index === 0 && <span className={styles.badge}>تصویر اصلی</span>}
          <div className={styles.tileActions}>
            <button type="button" onClick={() => move(index, index - 1)} disabled={busy || index === 0} aria-label="انتقال به جایگاه قبل">→</button>
            <button type="button" onClick={() => move(index, index + 1)} disabled={busy || index === images.length - 1} aria-label="انتقال به جایگاه بعد">←</button>
            <button type="button" onClick={() => void saveOrder(images.filter((_, i) => i !== index))} disabled={busy} aria-label="حذف تصویر"><Trash2 size={16} /></button>
          </div>
        </div>)}
        {images.length < MAX_IMAGES && <button type="button" className={styles.add} onClick={() => input.current?.click()} disabled={busy} aria-label="افزودن تصویر"><Plus size={27} /><span>افزودن تصویر</span></button>}
      </div>}
    </section>
  </main>;
}
