'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { addServiceCategory, deleteServiceCategory, getServiceCategory, updateServiceCategory } from '@/actions/service-categories.actions';
import { APPOINTMENT_COLORS } from '@/lib/appointment-colors';
import styles from './ServiceMenu.module.css';

type Category = { slug: string; name: string; description?: string | null; color: string };
type Suggestion = { name: string; durationMin: number; price: number; priceType?: string };
type SavedService = Suggestion & { id: string; categoryKey: string };

const categoryKey = (slug: string) => slug.startsWith('custom:') ? slug : `default:${slug}`;

const suggestions: Record<string, Suggestion[]> = {
  'eyebrows-lashes': [{ name: 'ترمیم مژه', durationMin: 60, price: 3_500_000 }],
};

export function ServiceMenu({ categories, services }: { categories: Category[]; services: SavedService[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, startDelete] = useTransition();
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [categoryLoaded, setCategoryLoaded] = useState(false);
  const [color, setColor] = useState('blue');
  const [error, setError] = useState('');
  const [saving, startTransition] = useTransition();
  const [selected, setSelected] = useState('all');
  const [search, setSearch] = useState('');
  const query = search.trim().toLocaleLowerCase('fa');
  const visible = categories.filter(category => selected === 'all' || selected === category.slug);
  const count = (slug: string) => (suggestions[slug] || []).length + services.filter(service => service.categoryKey === categoryKey(slug)).length;
  const total = categories.reduce((sum, category) => sum + count(category.slug), 0);
  const selectedColor = APPOINTMENT_COLORS.find(option => option.value === color) ?? APPOINTMENT_COLORS[0];
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialogOpen && dialog && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog?.open) dialog.close();
  }, [dialogOpen]);
  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (deleteCategory && dialog && !dialog.open) dialog.showModal();
    if (!deleteCategory && dialog?.open) dialog.close();
  }, [deleteCategory]);
  useEffect(() => {
    if (!colorOpen) return;
    const close = (event: PointerEvent) => { if (!colorRef.current?.contains(event.target as Node)) setColorOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [colorOpen]);
  useEffect(() => {
    if (!openActions) return;
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target as Element).closest('[data-category-actions]')) setOpenActions(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenActions(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, [openActions]);

  function submitCategory(formData: FormData) {
    setError('');
    startTransition(async () => {
      const result = editingId ? await updateServiceCategory(editingId, formData) : await addServiceCategory(formData);
      if (result.error) { setError(result.error); return; }
      setDialogOpen(false);
      setColorOpen(false);
      setDescription('');
      setName('');
      setEditingId(null);
      setColor('blue');
      setSelected('all');
      setSearch('');
      router.refresh();
    });
  }

  async function openEditCategory(id: string) {
    setOpenActions(null);
    setEditingId(id);
    setName('');
    setDescription('');
    setColor('blue');
    setError('');
    setCategoryLoaded(false);
    setLoadingCategory(true);
    setDialogOpen(true);
    try {
      const result = await getServiceCategory(id);
      if (!result.category) { setError(result.error || 'دریافت دسته‌بندی انجام نشد.'); return; }
      setName(result.category.name);
      setDescription(result.category.description || '');
      setColor(result.category.color);
      setCategoryLoaded(true);
    } catch {
      setError('دریافت دسته‌بندی انجام نشد. دوباره تلاش کنید.');
    } finally {
      setLoadingCategory(false);
    }
  }

  function confirmDelete() {
    if (!deleteCategory) return;
    const slug = deleteCategory.slug;
    const id = slug.startsWith('custom:') ? slug : `default:${slug}`;
    setDeleteError('');
    startDelete(async () => {
      try {
        const result = await deleteServiceCategory(id);
        if (result.error) { setDeleteError(result.error); return; }
        if (selected === slug) setSelected('all');
        setDeleteCategory(null);
        router.refresh();
      } catch {
        setDeleteError('حذف دسته‌بندی انجام نشد. دوباره تلاش کنید.');
      }
    });
  }

  return <div className={styles.page}>
    <div className={styles.container}>
      <header className={styles.heading}>
        <div><h1>فهرست خدمات</h1><p>خدمات کسب‌وکار خود را مشاهده و مدیریت کنید.</p></div>
      </header>
      <div className={styles.toolbar}>
        <label className={styles.search}><Search size={19} aria-hidden="true" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="جست‌وجوی نام خدمت" aria-label="جست‌وجوی نام خدمت" /></label>
      </div>
      <div className={styles.layout}>
        <aside className={styles.categories} aria-label="دسته‌بندی خدمات">
          <h2>دسته‌بندی‌ها</h2>
          <button type="button" className={selected === 'all' ? styles.selected : ''} onClick={() => setSelected('all')} aria-pressed={selected === 'all'}><span>همه دسته‌بندی‌ها</span><span className={styles.count}>{total.toLocaleString('fa-IR')}</span></button>
          {categories.map(category => <button type="button" key={category.slug} className={selected === category.slug ? styles.selected : ''} onClick={() => setSelected(category.slug)} aria-pressed={selected === category.slug}><span>{category.name}</span><span className={styles.count}>{count(category.slug).toLocaleString('fa-IR')}</span></button>)}
          <button type="button" className={styles.addCategory} onClick={() => { setEditingId(null); setName(''); setDescription(''); setColor('blue'); setError(''); setDialogOpen(true); }}>افزودن دسته‌بندی</button>
        </aside>
        <section className={styles.list} aria-label="پیشنهادهای خدمات">
          {visible.length === 0 ? <div className={styles.empty}>هنوز تخصصی برای کسب‌وکار شما ثبت نشده است.</div> : visible.map(category => {
            const items = [...(suggestions[category.slug] || []).map((item, index) => ({ ...item, id: `suggestion:${index}` })), ...services.filter(service => service.categoryKey === categoryKey(category.slug))].filter(item => item.name.toLocaleLowerCase('fa').includes(query));
            const categoryColor = APPOINTMENT_COLORS.find(color => color.value === category.color)?.hex || APPOINTMENT_COLORS[0].hex;
            return <section className={styles.group} key={category.slug}>
              <header className={styles.groupHeading}>
                <div><h2>{category.name}</h2>{category.description && <p>{category.description}</p>}</div>
                <div className={styles.actions} data-category-actions>
                  <button type="button" className={styles.actionsTrigger} aria-label={`عملیات ${category.name}`} aria-expanded={openActions === category.slug} onClick={() => setOpenActions(current => current === category.slug ? null : category.slug)}>عملیات <ChevronDown size={16} /></button>
                  {openActions === category.slug && <div className={styles.actionsMenu} aria-label={`عملیات ${category.name}`}>
                    <button type="button" onClick={() => openEditCategory(category.slug.startsWith('custom:') ? category.slug : `default:${category.slug}`)}>ویرایش</button>
                    <Link href={`/catalogue/services/service/add/new?category=${encodeURIComponent(categoryKey(category.slug))}`}>افزودن خدمت</Link>
                    {['افزودن بسته', 'بایگانی'].map(label => <button type="button" key={label} disabled title="این قابلیت هنوز آماده نیست">{label}</button>)}
                    <button type="button" className={styles.deleteAction} onClick={() => { setOpenActions(null); setDeleteError(''); setDeleteCategory(category); }}>حذف دائمی</button>
                  </div>}
                </div>
              </header>
              {items.length ? items.map(item => <article className={styles.card} key={item.id} style={{ borderInlineStartColor: categoryColor }}><div><h3>{item.name}</h3><p>{item.durationMin.toLocaleString('fa-IR')} دقیقه</p></div><span>{item.priceType === 'FREE' ? 'رایگان' : `${item.priceType === 'STARTS_AT' ? 'از ' : ''}${item.price.toLocaleString('fa-IR')} تومان`}</span></article>) : <div className={category.slug.startsWith('custom:') && !query ? styles.emptyCategory : styles.empty}>{query ? 'خدمتی با این نام پیدا نشد.' : category.slug.startsWith('custom:') ? 'خدمتی وجود ندارد' : 'پیشنهادهای این تخصص هنوز اضافه نشده‌اند.'}</div>}
            </section>;
          })}
        </section>
      </div>
    </div>
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="add-category-title" onClose={() => { setDialogOpen(false); setColorOpen(false); }} onCancel={event => { if (colorOpen) { event.preventDefault(); setColorOpen(false); } else if (saving || loadingCategory) event.preventDefault(); }}>
      <form action={submitCategory}>
        <button type="button" className={styles.close} onClick={() => setDialogOpen(false)} disabled={saving || loadingCategory} aria-label="بستن"><X size={22} /></button>
        <h2 id="add-category-title">{editingId ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}</h2>
        {loadingCategory && <p role="status">در حال دریافت دسته‌بندی…</p>}
        <div className={styles.fields}>
          <label>نام دسته‌بندی<input name="name" maxLength={100} required placeholder="مثلاً خدمات مو" autoFocus value={name} onChange={event => setName(event.target.value)} disabled={loadingCategory} /></label>
          <div className={styles.colorField} ref={colorRef}>
            <span id="appointment-color-label">رنگ نوبت</span>
            <input type="hidden" name="color" value={color} />
            <button type="button" className={styles.colorTrigger} aria-labelledby="appointment-color-label appointment-color-value" aria-expanded={colorOpen} aria-controls="appointment-color-options" onClick={() => setColorOpen(open => !open)}>
              <span className={styles.colorName}><span className={styles.colorSwatch} style={{ backgroundColor: selectedColor.hex }} /><span id="appointment-color-value">{selectedColor.label}</span></span><ChevronDown size={18} />
            </button>
            {colorOpen && <div id="appointment-color-options" className={styles.colorOptions} role="group" aria-label="انتخاب رنگ نوبت">
              {APPOINTMENT_COLORS.map(option => <button type="button" key={option.value} className={styles.colorOption} aria-pressed={color === option.value} onClick={() => { setColor(option.value); setColorOpen(false); colorRef.current?.querySelector<HTMLButtonElement>(`button`)?.focus(); }}><span className={styles.colorName}><span className={styles.colorSwatch} style={{ backgroundColor: option.hex }} />{option.label}</span>{color === option.value && <Check size={18} aria-hidden="true" />}</button>)}
            </div>}
          </div>
        </div>
        <label className={styles.description}><span>توضیحات <small>{description.length.toLocaleString('fa-IR')} / ۲۵۵</small></span><textarea name="description" maxLength={255} value={description} onChange={event => setDescription(event.target.value)} /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.dialogActions}><button type="button" onClick={() => setDialogOpen(false)} disabled={saving || loadingCategory}>انصراف</button><button type="submit" disabled={saving || loadingCategory || (!!editingId && !categoryLoaded)}>{saving ? 'در حال ذخیره…' : editingId ? 'ذخیره' : 'افزودن'}</button></div>
      </form>
    </dialog>
    <dialog ref={deleteDialogRef} className={styles.deleteDialog} aria-labelledby="delete-category-title" aria-describedby="delete-category-description" onClose={() => setDeleteCategory(null)} onCancel={event => { if (deleting) event.preventDefault(); }}>
      <button type="button" className={styles.close} onClick={() => setDeleteCategory(null)} disabled={deleting} aria-label="بستن"><X size={22} /></button>
      <h2 id="delete-category-title">حذف دائمی دسته‌بندی</h2>
      <p id="delete-category-description">آیا از حذف دائمی «{deleteCategory?.name}» و خدمات ثبت‌شده در آن مطمئن هستید؟</p>
      {deleteError && <p className={styles.error} role="alert">{deleteError}</p>}
      <div className={styles.deleteActions}><button type="button" onClick={() => setDeleteCategory(null)} disabled={deleting}>انصراف</button><button type="button" onClick={confirmDelete} disabled={deleting}>{deleting ? 'در حال حذف…' : 'پاک کردن همه'}</button></div>
    </dialog>
  </div>;
}
