'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import { Pencil, UserRound, X } from 'lucide-react';
import styles from './team-member-form.module.css';
import { imageUrl } from '@/lib/image-server';

export function ProfilePhoto({ initialImageName, onUploaded, onUploadingChange }: { initialImageName?: string | null; onUploaded: (token: string) => void; onUploadingChange: (uploading: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number; side: number; mode: 'move' | 'resize' } | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(initialImageName ? imageUrl(initialImageName) : null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, side: 0 });

  const close = () => { setSource(null); setSize({ width: 0, height: 0 }); buttonRef.current?.focus(); };
  useEffect(() => {
    if (!source) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !uploading) { setSource(null); setSize({ width: 0, height: 0 }); buttonRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [source, uploading]);

  const selectFile = (file?: File) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setError('لطفاً یک تصویر با حجم حداکثر ۱۰ مگابایت انتخاب کنید.'); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') { setSize({ width: 0, height: 0 }); setSource(reader.result); } };
    reader.onerror = () => setError('خواندن تصویر انجام نشد. دوباره تلاش کنید.');
    reader.readAsDataURL(file);
  };

  const moveCrop = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !viewRef.current || !size.width || !size.height) return;
    const scale = size.width / viewRef.current.clientWidth;
    const dx = (event.clientX - dragRef.current.x) * scale;
    const dy = (event.clientY - dragRef.current.y) * scale;
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    if (dragRef.current.mode === 'resize') {
      const side = clamp(dragRef.current.side + (dx + dy) / 2, Math.min(size.width, size.height) * 0.15, Math.min(size.width - dragRef.current.left, size.height - dragRef.current.top));
      setCrop({ x: dragRef.current.left, y: dragRef.current.top, side });
    } else {
      setCrop({ x: clamp(dragRef.current.left + dx, 0, size.width - dragRef.current.side), y: clamp(dragRef.current.top + dy, 0, size.height - dragRef.current.side), side: dragRef.current.side });
    }
  };

  const apply = async () => {
    const image = imageRef.current;
    if (!image || !size.width || !size.height) return;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) { setError('برش تصویر انجام نشد. دوباره تلاش کنید.'); return; }
    context.drawImage(image, crop.x, crop.y, crop.side, crop.side, 0, 0, 512, 512);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) { setError('برش تصویر انجام نشد. دوباره تلاش کنید.'); return; }
    setError(''); setUploading(true); onUploadingChange(true);
    try {
      const body = new FormData();
      body.append('image', blob, 'profile.png');
      const response = await fetch('/api/team/photo', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || typeof result.token !== 'string') throw new Error(result.error || 'بارگذاری تصویر انجام نشد.');
      setPhoto(canvas.toDataURL('image/png'));
      onUploaded(result.token);
      close();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'بارگذاری تصویر انجام نشد.'); }
    finally { setUploading(false); onUploadingChange(false); }
  };

  return <>
    <input ref={inputRef} className={styles.hiddenInput} type="file" accept="image/*" onChange={event => { selectFile(event.target.files?.[0]); event.target.value = ''; }} />
    <button ref={buttonRef} type="button" className={styles.avatar} aria-label={photo ? 'تغییر تصویر پروفایل' : 'انتخاب تصویر پروفایل'} onClick={() => inputRef.current?.click()}>
      <span className={styles.avatarContent}>{photo ? <Image src={photo} alt="پیش‌نمایش تصویر پروفایل" width={180} height={180} unoptimized /> : <UserRound size={88} strokeWidth={1.5} />}</span><span className={styles.avatarEdit} aria-hidden="true"><Pencil size={15} /></span>
    </button>
    {error && <p className={styles.photoError} role="alert">{error}</p>}
    {source && <div className={styles.modalBackdrop} onClick={() => { if (!uploading) close(); }}>
      <div className={styles.cropDialog} role="dialog" aria-modal="true" aria-labelledby="crop-title" aria-describedby="crop-description" onClick={event => event.stopPropagation()}>
        <button type="button" className={styles.cropClose} aria-label="بستن پنجره برش" onClick={close} disabled={uploading} autoFocus><X size={21} /></button>
        <h2 id="crop-title">برش تصویر</h2><p id="crop-description">کادر را جابه‌جا کنید و اندازهٔ آن را تغییر دهید.</p>
        <div className={styles.cropStage}><div ref={viewRef} className={styles.cropView} style={size.width ? { width: `min(100%, ${280 * size.width / size.height}px)`, aspectRatio: `${size.width} / ${size.height}` } : undefined} onPointerMove={moveCrop} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
          <Image ref={imageRef} src={source} alt="تصویر انتخاب‌شده برای برش" width={512} height={512} unoptimized draggable={false} onLoad={event => { const width = event.currentTarget.naturalWidth, height = event.currentTarget.naturalHeight, side = Math.min(width, height); setSize({ width, height }); setCrop({ x: (width - side) / 2, y: (height - side) / 2, side }); }} onError={() => { setSource(null); setError('این تصویر قابل خواندن نیست. تصویر دیگری انتخاب کنید.'); }} />
          {size.width > 0 && <div className={styles.cropSelection} style={{ left: `${crop.x / size.width * 100}%`, top: `${crop.y / size.height * 100}%`, width: `${crop.side / size.width * 100}%`, height: `${crop.side / size.height * 100}%` }} onPointerDown={event => { event.preventDefault(); viewRef.current?.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, left: crop.x, top: crop.y, side: crop.side, mode: 'move' }; }}><span className={styles.cropHandle} onPointerDown={event => { event.stopPropagation(); event.preventDefault(); viewRef.current?.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, left: crop.x, top: crop.y, side: crop.side, mode: 'resize' }; }} /></div>}
        </div></div>
        {size.width > 0 && <><label className={styles.zoom}>اندازهٔ کادر<input type="range" min={Math.min(size.width, size.height) * 0.15} max={Math.min(size.width, size.height)} step="any" value={crop.side} onChange={event => { const side = Number(event.target.value); setCrop(current => ({ side, x: Math.max(0, Math.min(size.width - side, current.x + (current.side - side) / 2)), y: Math.max(0, Math.min(size.height - side, current.y + (current.side - side) / 2)) })); }} /></label>
        <label className={styles.zoom}>موقعیت افقی<input type="range" min="0" max={Math.max(0, size.width - crop.side)} step="any" value={crop.x} onChange={event => setCrop(current => ({ ...current, x: Number(event.target.value) }))} /></label>
        <label className={styles.zoom}>موقعیت عمودی<input type="range" min="0" max={Math.max(0, size.height - crop.side)} step="any" value={crop.y} onChange={event => setCrop(current => ({ ...current, y: Number(event.target.value) }))} /></label></>}
        {error && <p className={styles.photoError} role="alert">{error}</p>}
        <div className={styles.cropActions}><button type="button" onClick={close} disabled={uploading}>انصراف</button><button type="button" disabled={!size.width || uploading} onClick={apply}>{uploading ? 'در حال بارگذاری…' : 'اعمال'}</button></div>
      </div>
    </div>}
  </>;
}
