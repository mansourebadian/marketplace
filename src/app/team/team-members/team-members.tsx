'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Check, ChevronDown, List, ListFilter, MapPin, Search, SlidersHorizontal, Store, X } from 'lucide-react';
import { imageUrl } from '@/lib/image-server';
import styles from './team-members.module.css';

const sortOptions = [
  { value: 'default', label: 'ترتیب پیش‌فرض' },
  { value: 'name-asc', label: 'نام (الف تا ی)' },
  { value: 'name-desc', label: 'نام (ی تا الف)' },
  { value: 'surname-asc', label: 'نام خانوادگی (الف تا ی)' },
  { value: 'surname-desc', label: 'نام خانوادگی (ی تا الف)' },
  { value: 'started-asc', label: 'تاریخ شروع (قدیمی‌ترین)', disabled: true },
  { value: 'started-desc', label: 'تاریخ شروع (جدیدترین)', disabled: true },
  { value: 'rating-desc', label: 'امتیاز (بیشترین)', disabled: true },
  { value: 'rating-asc', label: 'امتیاز (کمترین)', disabled: true },
  { value: 'updated-asc', label: 'آخرین به‌روزرسانی (قدیمی‌ترین)', disabled: true },
  { value: 'updated-desc', label: 'آخرین به‌روزرسانی (جدیدترین)', disabled: true },
] as const;

export function TeamMembers({ ownerName, ownerEmail, ownerPhone, locations, teamMembers }: { ownerName: string; ownerEmail: string; ownerPhone: string | null; locations: { id: string; name: string; address: string | null }[]; teamMembers: { id: string; firstName: string; lastName: string | null; email: string; phone: string | null; imageName: string | null }[] }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [sort, setSort] = useState('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const bulkRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const closeFilters = () => { setFiltersOpen(false); filterButtonRef.current?.focus(); };
  useEffect(() => {
    if (!filtersOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setFiltersOpen(false); filterButtonRef.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [filtersOpen]);
  const sortRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sortOpen) return;
    const closeOutside = (event: MouseEvent) => { if (!sortRef.current?.contains(event.target as Node)) setSortOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSortOpen(false); sortRef.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('mousedown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [sortOpen]);
  useEffect(() => {
    if (!bulkOpen) return;
    const closeOutside = (event: MouseEvent) => { if (!bulkRef.current?.contains(event.target as Node)) setBulkOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setBulkOpen(false); bulkRef.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('mousedown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [bulkOpen]);
  useEffect(() => {
    if (!actionsOpen) return;
    const closeOutside = (event: MouseEvent) => { if (!actionsRef.current?.contains(event.target as Node)) setActionsOpen(null); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setActionsOpen(null); actionsRef.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('mousedown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [actionsOpen]);
  const members = [
    { id: 'owner', name: ownerName, email: ownerEmail, phone: ownerPhone, role: 'مالک فضای کاری', initials: ownerName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join(''), imageName: null },
    { id: 'demo', name: 'وندی اسمیت (نمونه)', email: '', phone: null, role: 'بدون دسترسی', initials: 'و', imageName: null },
    ...teamMembers.map(member => ({ id: member.id, name: [member.firstName, member.lastName].filter(Boolean).join(' '), email: member.email, phone: member.phone, role: 'بدون دسترسی', initials: [member.firstName, member.lastName].filter(Boolean).map(part => part![0]).join(''), imageName: member.imageName })),
  ];
  const visibleMembers = members.filter(member => (role === 'all' || (role === 'owner' ? member.id === 'owner' : member.id !== 'owner')) && `${member.name} ${member.email} ${member.phone || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  if (sort.startsWith('name-') || sort.startsWith('surname-')) {
    const sortName = (name: string) => {
      const parts = name.replace(/\s*\(نمونه\)$/, '').trim().split(/\s+/);
      return sort.startsWith('surname-') ? parts.slice(1).join(' ') || parts[0] : parts[0];
    };
    visibleMembers.sort((a, b) => sortName(a.name).localeCompare(sortName(b.name), 'fa') * (sort.endsWith('-desc') ? -1 : 1));
  }
  const selectedVisibleCount = visibleMembers.filter(member => selected.includes(member.id)).length;
  const allVisibleSelected = visibleMembers.length > 0 && selectedVisibleCount === visibleMembers.length;
  const toggleVisible = () => { setSortOpen(false); setBulkOpen(false); setSelected(current => allVisibleSelected
    ? current.filter(id => !visibleMembers.some(member => member.id === id))
    : [...new Set([...current, ...visibleMembers.map(member => member.id)])]); };

  return <section className={styles.page} aria-labelledby="team-title">
    <div className={styles.heading}><h1 id="team-title">اعضای تیم <span>{members.length.toLocaleString('fa-IR')}</span></h1><Link className={styles.addMember} href="/team/team-members/add">افزودن</Link></div>
    <div className={styles.toolbar}>
      <label className={styles.search}><Search size={19} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی اعضای تیم" aria-label="جستجوی اعضای تیم" /></label>
      <button ref={filterButtonRef} type="button" className={styles.filterButton} onClick={() => setFiltersOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={17} aria-hidden="true" /> فیلترها</button>
      <label className={styles.select}><SlidersHorizontal size={17} aria-hidden="true" /><select aria-label="فیلتر نقش" value={role} onChange={event => setRole(event.target.value)}><option value="all">همه نقش‌ها</option><option value="owner">مالک فضای کاری</option><option value="demo">بدون دسترسی</option></select></label>
      {selected.length > 0 ? <div className={styles.selectionActions}>
        <span aria-live="polite"><Check size={17} aria-hidden="true" className={styles.selectedIcon} /> {selected.length.toLocaleString('fa-IR')} انتخاب‌شده</span>
        <button type="button" className={styles.deselect} onClick={() => { setSelected([]); setBulkOpen(false); }}>لغو انتخاب</button>
        <div className={styles.bulk} ref={bulkRef}><button type="button" className={styles.sortButton} aria-expanded={bulkOpen} aria-haspopup="true" onClick={() => setBulkOpen(open => !open)}>ویرایش گروهی</button>
          {bulkOpen && <div className={styles.bulkMenu}><button type="button" disabled title="تنظیم کمیسیون هنوز پیاده‌سازی نشده است">تنظیم کمیسیون</button></div>}
        </div>
      </div> : <div className={styles.sort} ref={sortRef}>
        <button type="button" className={styles.sortButton} aria-haspopup="true" aria-expanded={sortOpen} onClick={() => setSortOpen(open => !open)}><ListFilter size={17} aria-hidden="true" />{sortOptions.find(option => option.value === sort)?.label}</button>
        {sortOpen && <div className={styles.sortMenu} aria-label="ترتیب نمایش">{sortOptions.map(option => <button key={option.value} type="button" disabled={'disabled' in option && option.disabled} aria-pressed={sort === option.value} onClick={() => { setSort(option.value); setSortOpen(false); }}>{option.label}</button>)}</div>}
      </div>}
    </div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th><div className={styles.tableHeading}><input type="checkbox" className={styles.memberCheckbox} aria-label="انتخاب همه اعضای نمایش‌داده‌شده" checked={allVisibleSelected} disabled={!visibleMembers.length} ref={node => { if (node) node.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected; }} onChange={toggleVisible} />نام</div></th><th>اطلاعات تماس</th><th>نقش دسترسی</th><th><span className={styles.srOnly}>عملیات</span></th></tr></thead><tbody>
      {visibleMembers.map(member => <tr key={member.id}><td><div className={styles.person}><input type="checkbox" className={styles.memberCheckbox} aria-label={`انتخاب ${member.name}`} checked={selected.includes(member.id)} onChange={event => { const checked = event.target.checked; setSortOpen(false); setSelected(current => checked ? [...current, member.id] : current.filter(id => id !== member.id)); if (!checked && selected.length === 1) setBulkOpen(false); }} /><span className={`${styles.avatar} ${member.id === 'demo' ? styles.demo : ''}`}>{member.imageName ? <Image src={imageUrl(member.imageName)} alt="" width={50} height={50} unoptimized /> : member.initials}</span><strong>{member.name}</strong></div></td><td className={styles.contact}>{member.email || member.phone ? <div dir="ltr" className={styles.contactDetails}>{member.email && <span>{member.email}</span>}{member.phone && <span>{member.phone}</span>}</div> : '—'}</td><td>{member.role}</td><td><div className={styles.actions} ref={actionsOpen === member.id ? actionsRef : undefined}><button type="button" className={styles.actionsButton} aria-label={`عملیات ${member.name}`} aria-expanded={actionsOpen === member.id} aria-haspopup="true" onClick={() => setActionsOpen(current => current === member.id ? null : member.id)}>عملیات <ChevronDown size={16} /></button>{actionsOpen === member.id && <div className={styles.actionsMenu} aria-label={`عملیات ${member.name}`}><button type="button" disabled>ویرایش</button><Link href="/calendar">مشاهده تقویم</Link><button type="button" disabled>مشاهده شیفت‌های برنامه‌ریزی‌شده</button><button type="button" disabled>افزودن مرخصی</button></div>}</div></td></tr>)}
    </tbody></table>{visibleMembers.length === 0 && <p className={styles.empty}>عضوی با این مشخصات پیدا نشد.</p>}</div>
    {filtersOpen && <div className={styles.drawerOverlay} onClick={closeFilters}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="filters-title" onClick={event => event.stopPropagation()}>
        <header className={styles.drawerHeader}><h2 id="filters-title">همه فیلترها</h2><button type="button" autoFocus onClick={closeFilters} aria-label="بستن فیلترها"><X size={22} /></button></header>
        <div className={styles.drawerContent}>
          {[
            { id: 'locations', title: 'موقعیت‌ها', icon: MapPin },
            { id: 'type', title: 'نوع', icon: CalendarDays },
            { id: 'status', title: 'وضعیت', icon: List },
          ].map(({ id, title, icon: Icon }) => <section className={styles.filterSection} key={id}>
            <button type="button" className={styles.sectionToggle} aria-expanded={expanded.includes(id)} aria-controls={`filter-${id}`} onClick={() => setExpanded(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])}><Icon size={20} /><span>{title}</span><ChevronDown className={expanded.includes(id) ? styles.chevronOpen : ''} size={18} /></button>
            {expanded.includes(id) && <div id={`filter-${id}`} className={styles.filterOptions}>
              {id === 'locations' && <><label className={styles.checkboxOption}><input type="checkbox" disabled /> انتخاب همه</label>{locations.length ? locations.map(location => <label key={location.id} className={styles.locationOption}><input type="checkbox" disabled /><span className={styles.storeIcon}><Store size={18} /></span><span>{location.name}<small>{location.address || 'آدرس کسب‌وکار ثبت نشده است'}</small></span></label>) : <p className={styles.filterHint}>موقعیتی ثبت نشده است.</p>}</>}
              {id === 'type' && <><label className={styles.checkboxOption}><input type="checkbox" disabled /> قابل رزرو</label><label className={styles.checkboxOption}><input type="checkbox" disabled /> غیرقابل رزرو</label></>}
              {id === 'status' && <><button type="button" className={styles.statusOption} disabled>همه اعضای تیم</button><button type="button" className={styles.statusOption} disabled>فعال <Check size={18} /></button><button type="button" className={styles.statusOption} disabled>بایگانی‌شده</button></>}
              <p className={styles.filterHint}>اطلاعات لازم برای این فیلتر هنوز برای اعضای تیم ثبت نمی‌شود.</p>
            </div>}
          </section>)}
        </div>
        <footer className={styles.drawerFooter}><button type="button" disabled>پاک کردن فیلترها</button><button type="button" onClick={closeFilters}>اعمال</button></footer>
      </aside>
    </div>}
  </section>;
}
