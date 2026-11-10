'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Lightbulb, Pencil, X } from 'lucide-react';
import { recurringPeriods, periodMinutes, type RecurringShift } from '@/lib/recurring-shifts';
import styles from './scheduled-shifts.module.css';

type Member = { id: string; name: string };
type Shift = { memberKey: string; date: string; startTime: string | null; endTime: string | null };
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function weekStart(date: Date) { const result = new Date(date.getFullYear(), date.getMonth(), date.getDate()); result.setDate(result.getDate() - (result.getDay() + 1) % 7); return result; }
function addDays(date: Date, days: number) { const result = new Date(date); result.setDate(result.getDate() + days); return result; }
function minutes(shift?: Shift & { periods: { start: string; end: string }[] }) { return shift?.periods.reduce((sum, period) => sum + periodMinutes(period), 0) || 0; }
function duration(value: number) { return value ? `${new Intl.NumberFormat('fa-IR').format(Math.floor(value / 60))} ساعت${value % 60 ? ` و ${new Intl.NumberFormat('fa-IR').format(value % 60)} دقیقه` : ''}` : '۰ ساعت'; }
const dayFormat = new Intl.DateTimeFormat('fa-IR', { weekday: 'short', day: 'numeric', month: 'short' });
const rangeFormat = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' });

export function ScheduledShifts({ members, initialShifts, recurringShifts }: { members: Member[]; initialShifts: Shift[]; recurringShifts: RecurringShift[] }) {
  const [week, setWeek] = useState(() => weekStart(new Date()));
  const [shifts, setShifts] = useState(initialShifts);
  const [editing, setEditing] = useState<{ member: Member; date: string } | null>(null);
  const [working, setWorking] = useState(true);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [memberMenu, setMemberMenu] = useState<{ member: Member; top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!memberMenu) return;
    const closeOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !menuTrigger.current?.contains(event.target as Node)) setMemberMenu(null);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMemberMenu(null); menuTrigger.current?.focus(); }
    };
    const closeOnMove = () => setMemberMenu(null);
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    window.addEventListener('resize', closeOnMove);
    window.addEventListener('scroll', closeOnMove, true);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
      window.removeEventListener('resize', closeOnMove);
      window.removeEventListener('scroll', closeOnMove, true);
    };
  }, [memberMenu]);
  function toggleMemberMenu(member: Member, button: HTMLButtonElement) {
    if (memberMenu?.member.id === member.id) { setMemberMenu(null); return; }
    const rect = button.getBoundingClientRect();
    menuTrigger.current = button;
    setMemberMenu({ member, top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 310)), right: Math.max(8, Math.min(window.innerWidth - rect.right, window.innerWidth - 230)) });
  }
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  const find = (memberKey: string, date: string) => {
    const explicit = shifts.find(shift => shift.memberKey === memberKey && shift.date === date);
    if (explicit) return { ...explicit, periods: explicit.startTime && explicit.endTime ? [{ start: explicit.startTime, end: explicit.endTime }] : [] };
    const periods = recurringPeriods(recurringShifts, memberKey, date);
    return { memberKey, date, startTime: periods[0]?.start || null, endTime: periods[0]?.end || null, periods };
  };
  function edit(member: Member, date: string) { const shift = find(member.id, date); setEditing({ member, date }); setWorking(Boolean(shift?.startTime)); setStart(shift?.startTime || '09:00'); setEnd(shift?.endTime || '17:00'); setError(''); }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || saving) return;
    if (working && (!start || !end || end <= start)) { setError('ساعت پایان باید بعد از ساعت شروع باشد.'); return; }
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/team/shifts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberKey: editing.member.id, date: editing.date, startTime: working ? start : null, endTime: working ? end : null }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'ذخیره شیفت انجام نشد.'); return; }
      setShifts(current => [...current.filter(item => item.memberKey !== result.memberKey || item.date !== result.date), result]); setEditing(null);
    } catch { setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.'); } finally { setSaving(false); }
  }
  return <div className={styles.page}>
    <div className={styles.heading}><div><h1>شیفت‌های برنامه‌ریزی‌شده</h1><p>ساعات حضور اعضای تیم را برای هر روز تعیین کنید.</p></div></div>
    <div className={styles.toolbar}><span>برنامه هفتگی تیم</span><div className={styles.controls}><button type="button" onClick={() => setWeek(weekStart(new Date()))}>این هفته</button><div className={styles.weekNav}><button type="button" aria-label="هفته قبل" onClick={() => setWeek(addDays(week, -7))}><ChevronRight size={18} /></button><span>{rangeFormat.format(days[0])} تا {rangeFormat.format(days[6])}</span><button type="button" aria-label="هفته بعد" onClick={() => setWeek(addDays(week, 7))}><ChevronLeft size={18} /></button></div></div></div>
    <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>عضو تیم</th>{days.map(day => { const key = dateKey(day); return <th key={key}>{dayFormat.format(day)}<small>{duration(members.reduce((sum, member) => sum + minutes(find(member.id, key)), 0))}</small></th>; })}</tr></thead><tbody>{members.map(member => <tr key={member.id}><th scope="row"><div className={styles.person}><span className={styles.avatar}>{member.name.trim().slice(0, 1)}</span><span><strong>{member.name}</strong><small>{duration(days.reduce((sum, day) => sum + minutes(find(member.id, dateKey(day))), 0))}</small></span><button type="button" className={styles.pencil} aria-label={`عملیات ${member.name}`} aria-expanded={memberMenu?.member.id === member.id} aria-haspopup="true" onClick={event => toggleMemberMenu(member, event.currentTarget)}><Pencil size={16} /></button></div></th>{days.map(day => { const key = dateKey(day); const shift = find(member.id, key); return <td key={key}><button type="button" className={shift?.startTime ? styles.shift : styles.off} onClick={() => edit(member, key)} aria-label={`ویرایش شیفت ${member.name}، ${dayFormat.format(day)}`}>{shift?.startTime ? <span dir="ltr">{shift.periods.map(period => `${period.start} - ${period.end}`).join(" / ")}</span> : 'بدون شیفت'}</button></td>; })}</tr>)}</tbody></table></div>
    {memberMenu && createPortal(<div ref={menuRef} className={styles.memberMenu} style={{ top: memberMenu.top, right: memberMenu.right }} aria-label={`عملیات ${memberMenu.member.name}`}>
      <strong>برنامه کاری</strong>
      <Link href={`/team/scheduled-shifts/repeating?member=${encodeURIComponent(memberMenu.member.id)}`}>تنظیم شیفت‌های تکراری</Link>
      <button type="button" disabled title="به‌زودی">حذف از موقعیت</button>
      <button type="button" disabled title="به‌زودی" className={styles.danger}>حذف همه شیفت‌ها</button>
      <hr />
      <strong>عضو تیم</strong>
      <button type="button" disabled title="به‌زودی">مشاهده عضو تیم</button>
      <button type="button" disabled title="به‌زودی">ویرایش عضو تیم</button>
    </div>, document.body)}
    <div className={styles.hint}><Lightbulb size={20} /><span>برای تعیین یا تغییر ساعت حضور، روی خانه مربوط به عضو تیم و روز موردنظر کلیک کنید.</span></div>
    {editing && <div className={styles.overlay} onClick={() => !saving && setEditing(null)}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="shift-title" onClick={event => event.stopPropagation()}><div className={styles.dialogHeading}><h2 id="shift-title">ویرایش شیفت</h2><button type="button" onClick={() => setEditing(null)} aria-label="بستن" disabled={saving}><X size={20} /></button></div><p>{editing.member.name} · {rangeFormat.format(new Date(`${editing.date}T12:00:00`))}</p><form onSubmit={save}><label className={styles.check}><input type="checkbox" checked={working} onChange={event => setWorking(event.target.checked)} /> این روز مشغول به کار است</label>{working && <div className={styles.times}><label>ساعت شروع<input type="time" value={start} onChange={event => setStart(event.target.value)} required /></label><label>ساعت پایان<input type="time" value={end} onChange={event => setEnd(event.target.value)} required /></label></div>}{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.footer}><button type="button" onClick={() => setEditing(null)} disabled={saving}>انصراف</button><button type="submit" disabled={saving}>{saving ? 'در حال ذخیره…' : 'ذخیره'}</button></div></form></section></div>}
  </div>;
}
