'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { FileImage, FileUp, MoreVertical, X } from 'lucide-react';
import styles from './BundleForm.module.css';
import { imageUrl } from '@/lib/image-server';

type ImagePreview = { id: string; file?: File; url: string; label: string };
const imageFormats: Record<string, { types: string[]; extensions: string[] }> = {
  jpeg: { types: ['image/jpeg'], extensions: ['jpg', 'jpeg'] },
  png: { types: ['image/png'], extensions: ['png'] },
  avif: { types: ['image/avif'], extensions: ['avif'] },
  webp: { types: ['image/webp'], extensions: ['webp'] },
};

async function hasValidImageFormat(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const format = Object.entries(imageFormats).find(([, value]) => value.types.includes(file.type.toLowerCase()) && extension && value.extensions.includes(extension))?.[0];
  if (!format) return false;
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const textAt = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length));
  if (format === 'jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (format === 'png') return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (format === 'webp') return bytes.length >= 12 && textAt(0, 4) === 'RIFF' && textAt(8, 4) === 'WEBP';
  if (bytes.length < 16 || textAt(4, 4) !== 'ftyp') return false;
  if (['avif', 'avis'].includes(textAt(8, 4))) return true;
  for (let offset = 16; offset + 4 <= bytes.length; offset += 4) {
    if (['avif', 'avis'].includes(textAt(offset, 4))) return true;
  }
  return false;
}

function readDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Invalid image'));
    image.src = url;
  });
}

export function BundleImages({ initialImages = [], onFilesChange, onRetainedChange, onProcessingChange }: { initialImages?: { id: string; url: string }[]; onFilesChange: (files: File[]) => void; onRetainedChange?: (ids: string[]) => void; onProcessingChange: (processing: boolean) => void }) {
  const [images, setImages] = useState<ImagePreview[]>(() => initialImages.map(image => ({ id: image.id, url: imageUrl(image.url), label: 'تصویر بسته' })));
  const imagesRef = useRef<ImagePreview[]>(images);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const active = useRef(false);
  const busy = useRef(false);
  const urls = useRef(new Set<string>());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    active.current = true;
    const ownedUrls = urls.current;
    return () => { active.current = false; ownedUrls.forEach(url => URL.revokeObjectURL(url)); ownedUrls.clear(); };
  }, []);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(''), 6000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  async function addImages(files: File[]) {
    if (!files.length || busy.current) return;
    busy.current = true;
    onProcessingChange(true);
    setError('');
    setProcessing({ done: 0, total: files.length });
    for (const [index, file] of files.entries()) {
      let url: string | undefined;
      try {
        if (!(await hasValidImageFormat(file))) throw new Error('فرمت فایل نامعتبر است. فقط تصاویر JPG، PNG، AVIF و WebP مجاز هستند.');
        if (file.size > 45 * 1024 * 1024) throw new Error('حجم هر تصویر باید حداکثر ۴۵ مگابایت باشد.');
        if (!active.current) break;
        url = URL.createObjectURL(file);
        urls.current.add(url);
        const dimensions = await readDimensions(url);
        if (!active.current) break;
        if (dimensions.width < 500 || dimensions.height < 500) throw new Error('ابعاد تصویر باید حداقل ۵۰۰ در ۵۰۰ پیکسل باشد.');
        const previewUrl = url;
        imagesRef.current = [...imagesRef.current, { id: previewUrl, file, url: previewUrl, label: file.name }];
        setImages(imagesRef.current);
        onFilesChange(imagesRef.current.flatMap(image => image.file ? [image.file] : []));
        url = undefined;
      } catch (reason) {
        if (url) { URL.revokeObjectURL(url); urls.current.delete(url); }
        if (active.current) setError(reason instanceof Error && reason.message !== 'Invalid image' ? reason.message : 'خواندن تصویر انجام نشد. فایل دیگری انتخاب کنید.');
      }
      if (active.current) setProcessing({ done: index + 1, total: files.length });
    }
    busy.current = false;
    if (active.current) { setProcessing(null); onProcessingChange(false); }
  }

  function selectImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    void addImages(files);
  }

  function dropImages(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addImages(Array.from(event.dataTransfer.files));
  }

  function removeImage(image: ImagePreview) {
    if (image.file) URL.revokeObjectURL(image.url);
    urls.current.delete(image.url);
    imagesRef.current = imagesRef.current.filter(item => item.id !== image.id);
    setImages(imagesRef.current);
    onFilesChange(imagesRef.current.flatMap(item => item.file ? [item.file] : []));
    onRetainedChange?.(imagesRef.current.filter(item => !item.file).map(item => item.id));
  }

  return <section className={styles.card}>
    {error && <div className={styles.imageToast} role="alert"><span>{error}</span><button type="button" aria-label="بستن پیام خطا" onClick={() => setError('')}><X size={18} /></button></div>}
    <h2>تصاویر نمونه‌کار {images.length > 0 && <span className={styles.imageCount}>{images.length.toLocaleString('fa-IR')}</span>}</h2>
    <p className={styles.help}>تصاویری را که هنگام رزرو آنلاین به مشتریان نمایش داده می‌شوند، اضافه کنید.</p>
    {processing ? <div className={styles.imageProcessing} role="status" aria-live="polite"><strong>در حال پردازش تصاویر…</strong><progress max={processing.total} value={processing.done} /></div> :
      <div className={`${styles.upload} ${images.length ? styles.uploadCompact : ''} ${dragging ? styles.uploadDragging : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={dropImages}>
        {images.length ? <div><strong>تصاویر را اینجا بکشید و رها کنید</strong><p>یا برای انتخاب فایل کلیک کنید</p></div> : <><FileImage size={26} /><strong>تصاویر خود را اینجا اضافه کنید</strong></>}
        <label className={styles.outline}>انتخاب فایل<input ref={inputRef} type="file" accept="image/jpeg,image/png,image/avif,image/webp" multiple onChange={selectImages} /></label>
      </div>}
    {!images.length && !processing && <p className={styles.footnote}>فرمت‌های jpg، png، avif و webp · حداکثر حجم ۴۵ مگابایت · حداقل ابعاد ۵۰۰ در ۵۰۰ پیکسل</p>}
    {(images.length > 0 || processing) && <div className={styles.imageGrid}>
      {images.map(image => <div className={styles.imageTile} key={image.id}>
        {/* Object URLs are local previews and cannot be optimized by next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={`پیش‌نمایش ${image.label}`} />
        <details className={styles.imageActions}><summary aria-label={`عملیات تصویر ${image.label}`}><MoreVertical size={17} /></summary><button type="button" onClick={() => removeImage(image)}>حذف تصویر</button></details>
      </div>)}
      {processing && <div className={styles.imagePlaceholder}><FileUp size={25} /><progress max={processing.total} value={processing.done} aria-label="پیشرفت پردازش تصویر" /></div>}
    </div>}
  </section>;
}
