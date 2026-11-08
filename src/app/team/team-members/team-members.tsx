'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import styles from './team-members.module.css';

export function TeamMembers({ ownerName, ownerEmail, ownerPhone }: { ownerName: string; ownerEmail: string; ownerPhone: string | null }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [sort, setSort] = useState('default');
  const members = [
    { id: 'owner', name: ownerName, email: ownerEmail, phone: ownerPhone, role: 'مالک فضای کاری', initials: ownerName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('') },
    { id: 'demo', name: 'وندی اسمیت (نمونه)', email: '', phone: null, role: 'بدون دسترسی', initials: 'و' },
  ];
  const visibleMembers = members.filter(member => (role === 'all' || member.id === role) && `${member.name} ${member.email} ${member.phone || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  if (sort === 'name') visibleMembers.sort((a, b) => a.name.localeCompare(b.name, 'fa'));

  return <section className={styles.page} aria-labelledby="team-title">
    <div className={styles.heading}><h1 id="team-title">اعضای تیم <span>{members.length.toLocaleString('fa-IR')}</span></h1></div>
    <div className={styles.toolbar}>
      <label className={styles.search}><Search size={19} aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی اعضای تیم" aria-label="جستجوی اعضای تیم" /></label>
      <label className={styles.select}><SlidersHorizontal size={17} aria-hidden="true" /><select aria-label="فیلتر نقش" value={role} onChange={event => setRole(event.target.value)}><option value="all">همه نقش‌ها</option><option value="owner">مالک فضای کاری</option><option value="demo">بدون دسترسی</option></select></label>
      <label className={`${styles.select} ${styles.sort}`}><select aria-label="ترتیب نمایش" value={sort} onChange={event => setSort(event.target.value)}><option value="default">ترتیب پیش‌فرض</option><option value="name">نام</option></select></label>
    </div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>نام</th><th>اطلاعات تماس</th><th>نقش دسترسی</th></tr></thead><tbody>
      {visibleMembers.map(member => <tr key={member.id}><td><div className={styles.person}><span className={`${styles.avatar} ${member.id === 'demo' ? styles.demo : ''}`}>{member.initials}</span><strong>{member.name}</strong></div></td><td className={styles.contact}>{member.email || member.phone ? <div dir="ltr" className={styles.contactDetails}>{member.email && <span>{member.email}</span>}{member.phone && <span>{member.phone}</span>}</div> : '—'}</td><td>{member.role}</td></tr>)}
    </tbody></table>{visibleMembers.length === 0 && <p className={styles.empty}>عضوی با این مشخصات پیدا نشد.</p>}</div>
  </section>;
}
