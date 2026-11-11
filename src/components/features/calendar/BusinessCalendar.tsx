'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { imageUrl } from '@/lib/image-server';
import { BookOpen, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Grid2X2Plus, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { BusinessWorkspace } from './BusinessWorkspace';
import styles from './BusinessCalendar.module.css';

const viewOptions = [
  { value: 'Day', label: 'روزانه', icon: BookOpen },
  { value: 'ThreeDay', label: '۳ روزه', icon: Grid2X2Plus },
  { value: 'Week', label: 'هفتگی', icon: CalendarDays },
  { value: 'Month', label: 'ماهانه', icon: CalendarDays },
] as const;
type CalendarView = (typeof viewOptions)[number]['value'];
const weekdays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const persianDay = new Intl.DateTimeFormat('en-US-u-ca-persian', { day: 'numeric' });
type CalendarAppointment = { id: string; memberKey: string; serviceName: string; startsAt: string; endsAt: string; customerName: string; firstVisit: boolean; note: string | null; isTest: boolean };

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function tehranDateKey(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(item => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function appointmentMinutes(value: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  return Number(parts.find(item => item.type === 'hour')?.value) * 60 + Number(parts.find(item => item.type === 'minute')?.value);
}

function appointmentTime(value: string) {
  return new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
}

function monthStart(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - Number(persianDay.format(date)) + 1);
  start.setHours(12, 0, 0, 0);
  return start;
}

export function BusinessCalendar({ ownerName, businessName, members }: { ownerName: string; businessName: string; members: { id: string; firstName: string; lastName: string | null; imageName: string | null }[] }) {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState('all');
  const [date, setDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [showDemo, setShowDemo] = useState(true);
  const [view, setView] = useState<CalendarView>('Day');
  const [viewOpen, setViewOpen] = useState(false);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const viewButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initials = ownerName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const today = date.toDateString() === now.toDateString();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const rangeStart = new Date(date);
  if (view === 'Week') rangeStart.setDate(rangeStart.getDate() - (rangeStart.getDay() + 1) % 7);
  const rangeDays = Array.from({ length: view === 'Week' ? 7 : 3 }, (_, index) => {
    const day = new Date(rangeStart);
    day.setDate(day.getDate() + index);
    return day;
  });
  const allMembers = [
    { id: 'owner', name: ownerName, initials, imageName: null },
    ...(showDemo ? [{ id: 'demo', name: 'وندی اسمیت (نمونه)', initials: 'و س', imageName: null }] : []),
    ...members.map(member => ({
      id: member.id,
      name: [member.firstName, member.lastName].filter(Boolean).join(' '),
      initials: [member.firstName, member.lastName].filter(Boolean).map(part => part![0]).join(''),
      imageName: member.imageName,
    })),
  ];
  const teamMembers = allMembers.filter(member => selectedMember === 'all' || member.id === selectedMember);
  const dateRange = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(rangeDays[0], rangeDays[rangeDays.length - 1]);
  const selectedDateKey = localDateKey(date);

  useEffect(() => {
    const center = new Date(`${selectedDateKey}T12:00:00`);
    const from = new Date(center); from.setDate(from.getDate() - 40);
    const to = new Date(center); to.setDate(to.getDate() + 41);
    const controller = new AbortController();
    async function load() {
      try {
        const params = new URLSearchParams({ from: localDateKey(from), to: localDateKey(to) });
        const response = await fetch(`/api/business/calendar/appointments?${params}`, { signal: controller.signal, cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setAppointments(result.appointments);
        setAppointmentsError('');
      } catch (error) {
        if (!controller.signal.aborted) { setAppointments([]); setAppointmentsError(error instanceof Error ? error.message : 'دریافت نوبت‌ها انجام نشد.'); }
      }
    }
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [selectedDateKey, refreshKey]);

  const firstOfMonth = monthStart(date);
  const nextMonth = new Date(firstOfMonth);
  nextMonth.setDate(nextMonth.getDate() + 32);
  const daysInMonth = Math.round((monthStart(nextMonth).getTime() - firstOfMonth.getTime()) / 86_400_000);
  const monthOffset = (firstOfMonth.getDay() + 1) % 7;
  const monthDays = Array.from({ length: Math.ceil((monthOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = new Date(firstOfMonth);
    day.setDate(day.getDate() + index - monthOffset);
    return day;
  });
  const currentWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  currentWeekStart.setDate(currentWeekStart.getDate() - (currentWeekStart.getDay() + 1) % 7);
  const monthSamples = [
    { time: '۹:۰۰', name: 'جان دو' },
    { time: '۱۰:۰۰', name: 'جک دو' },
    { time: '۱۱:۰۰', name: 'جین دو' },
  ];

  useEffect(() => {
    if (!viewOpen) return;
    function closeOutside(event: PointerEvent) {
      if (!viewMenuRef.current?.contains(event.target as Node)) setViewOpen(false);
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [viewOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, (new Date().getHours() - 2) * 96);
    return () => window.clearInterval(timer);
  }, []);

  function moveDate(amount: number) {
    setDate(current => {
      const next = new Date(current);
      if (view === 'Month') {
        const start = monthStart(current);
        start.setDate(start.getDate() + (amount > 0 ? 32 : -1));
        return monthStart(start);
      }
      next.setDate(next.getDate() + amount * (view === 'Week' ? 7 : view === 'ThreeDay' ? 3 : 1));
      return next;
    });
  }

  function changeView(nextView: CalendarView) {
    setView(nextView);
    setViewOpen(false);
    viewButtonRef.current?.focus();
    if (scrollRef.current) scrollRef.current.scrollTop = nextView === 'Day' ? Math.max(0, (now.getHours() - 2) * 96) : 0;
  }

  return (
    <BusinessWorkspace ownerName={ownerName} activePage="/calendar" label={`تقویم ${businessName}`}>
      <section className={styles.content} aria-label="تقویم نوبت‌ها">
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <button onClick={() => setDate(new Date())}>امروز</button>
            <div className={styles.dateControl}>
              <button aria-label="تاریخ قبلی" onClick={() => moveDate(-1)}><ChevronRight size={17} /></button>
              <label className={styles.dateLabel}>
                {view === 'ThreeDay' || view === 'Week' ? dateRange : date.toLocaleDateString('fa-IR', view === 'Month' ? { month: 'long', year: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' })}
                <input aria-label="انتخاب تاریخ" type="date" value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`} onChange={event => { if (event.target.value) setDate(new Date(`${event.target.value}T12:00:00`)); }} />
              </label>
              <button aria-label="تاریخ بعدی" onClick={() => moveDate(1)}><ChevronLeft size={17} /></button>
            </div>
            <label className={styles.select}><select aria-label="فیلتر اعضای تیم" value={selectedMember} onChange={event => setSelectedMember(event.target.value)}><option value="all">اعضای تیم</option>{allMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select><ChevronDown size={15} /></label>
            <button aria-label={showDemo ? 'پنهان کردن عضو نمونه' : 'نمایش عضو نمونه'} onClick={() => { if (showDemo && selectedMember === 'demo') setSelectedMember('all'); setShowDemo(value => !value); }}><SlidersHorizontal size={19} /></button>
          </div>
          <div className={styles.toolbarGroup}>
            <button aria-label="به‌روزرسانی تقویم" onClick={() => { setNow(new Date()); setRefreshKey(value => value + 1); router.refresh(); }}><RefreshCw size={19} /></button>
            <div className={styles.viewPicker} ref={viewMenuRef} onKeyDown={event => {
              if (event.key === 'Escape') { setViewOpen(false); viewButtonRef.current?.focus(); }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                setViewOpen(true);
                const key = event.key;
                requestAnimationFrame(() => {
                  const items = viewMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
                  if (!items?.length) return;
                  const index = Array.from(items).findIndex(item => item === document.activeElement);
                  const next = key === 'Home' ? 0 : key === 'End' ? items.length - 1 : (index + (key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
                  items[next].focus();
                });
              }
            }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setViewOpen(false); }}>
              <button ref={viewButtonRef} type="button" aria-label="نمای تقویم" aria-haspopup="menu" aria-expanded={viewOpen} aria-controls="calendar-view-menu" onClick={() => setViewOpen(open => !open)}>
                {viewOptions.find(option => option.value === view)?.label}<ChevronDown size={15} className={viewOpen ? styles.chevronOpen : undefined} />
              </button>
              {viewOpen && <div id="calendar-view-menu" role="menu" aria-label="نمای تقویم" className={styles.viewMenu}>
                {viewOptions.map(({ value, label, icon: Icon }) => <button key={value} type="button" role="menuitemradio" aria-checked={view === value} className={view === value ? styles.selectedView : undefined} onClick={() => changeView(value)}><Icon size={18} strokeWidth={1.6} />{label}</button>)}
              </div>}
            </div>
          </div>
        </div>
        {appointmentsError && <p role="alert" className={styles.calendarError}>{appointmentsError}</p>}
        <div className={styles.calendarScroll} ref={scrollRef}>
          {view === 'Month' ? <div className={styles.monthCalendar} aria-label="تقویم ماهانه">
            <div className={styles.weekdays}>{weekdays.map(day => <strong key={day}>{day}</strong>)}</div>
            <div className={styles.monthGrid}>
              {monthDays.map((day, index) => {
                const isToday = day.toDateString() === now.toDateString();
                const outsideMonth = index < monthOffset || index >= monthOffset + daysInMonth;
                const isHatched = outsideMonth || day < currentWeekStart || day.getDay() === 5 || isToday;
                const firstDay = persianDay.format(day) === '1';
                return <button type="button" key={day.toISOString()} className={`${styles.monthDay} ${outsideMonth ? styles.outsideMonth : ''} ${isHatched ? styles.hatchedDay : ''}`} aria-label={day.toLocaleDateString('fa-IR', { dateStyle: 'full' })} aria-current={isToday ? 'date' : undefined} onClick={() => { setDate(day); changeView('Day'); }}>
                  <span className={`${styles.monthDayNumber} ${firstDay ? styles.monthStartLabel : ''}`}>{day.toLocaleDateString('fa-IR', firstDay ? { month: 'long', day: 'numeric' } : { day: 'numeric' })}</span>
                  {appointments.filter(item => tehranDateKey(item.startsAt) === localDateKey(day) && (selectedMember === 'all' || item.memberKey === selectedMember)).map(item => <span key={item.id} className={styles.appointmentStrip}><bdi>{appointmentTime(item.startsAt)}</bdi><strong>{item.customerName} · {item.serviceName}</strong>{item.isTest && <span className={styles.sampleLabel}>آزمایشی</span>}</span>)}
                  {isToday && showDemo && <span className={styles.monthAppointments}>{monthSamples.map(sample => <span key={sample.name} className={styles.appointmentStrip}><bdi>{sample.time}</bdi><strong>{sample.name}</strong><span className={styles.sampleLabel}>نمونه</span></span>)}</span>}
                </button>;
              })}
            </div>
          </div> : view === 'ThreeDay' || view === 'Week' ? <div className={`${styles.threeDayCalendar} ${view === 'Week' ? styles.weekCalendar : ''}`} role="table" aria-label={view === 'Week' ? 'تقویم هفتگی اعضای تیم' : 'تقویم سه‌روزهٔ اعضای تیم'}>
            <div className={styles.threeDayHeader} role="row">
              <div className={styles.teamCorner} role="columnheader"><span className="sr-only">عضو تیم</span></div>
              {rangeDays.map(day => <div key={day.toDateString()} role="columnheader" aria-current={day.toDateString() === now.toDateString() ? 'date' : undefined} className={`${styles.threeDayHeading} ${day.toDateString() === now.toDateString() ? styles.todayHeading : view === 'Week' && day < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? styles.pastHeading : ''}`}>
                <span className={styles.dayNumber}>{day.toLocaleDateString('fa-IR', { day: 'numeric' })}</span>
                <span>{day.toLocaleDateString('fa-IR', { weekday: 'long' })}</span>
              </div>)}
            </div>
            <div className={styles.threeDayRows}>
              {teamMembers.map(member => <div key={member.id} role="row" className={styles.threeDayRow}>
                <div role="rowheader" className={styles.threeDayMember}>
                  <span className={`${styles.memberAvatar} ${member.id === 'demo' ? styles.demoAvatar : ''}`}>{member.imageName ? <Image src={imageUrl(member.imageName)} alt="" fill sizes="59px" unoptimized /> : member.initials}</span>
                  <strong title={member.name}>{member.name}</strong>
                </div>
                {rangeDays.map(day => {
                  const isToday = day.toDateString() === now.toDateString();
                  const samples = member.id === 'owner'
                    ? [{ time: '۹:۰۰ – ۹:۴۰', name: 'جان دو' }, { time: '۱۱:۰۰ – ۱۱:۵۰', name: 'جین دو' }]
                    : [{ time: '۱۰:۰۰ – ۱۰:۳۰', name: 'جک دو' }];
                  return <div key={day.toDateString()} role="cell" className={`${styles.threeDayCell} ${isToday ? styles.hatchedDay : ''}`} aria-label={`${member.name}، ${day.toLocaleDateString('fa-IR', { dateStyle: 'full' })}`}>
                    {appointments.filter(item => item.memberKey === member.id && tehranDateKey(item.startsAt) === localDateKey(day)).map(item => <div key={item.id} className={styles.appointmentStrip}><bdi>{appointmentTime(item.startsAt)}</bdi><strong>{item.customerName} · {item.serviceName}</strong>{item.isTest && <span className={styles.sampleLabel}>آزمایشی</span>}</div>)}
                    {isToday && showDemo && (member.id === 'owner' || member.id === 'demo') && samples.map(sample => <div key={sample.name} className={styles.appointmentStrip}><bdi>{view === 'Week' ? sample.time.split(' – ')[0] : sample.time}</bdi><strong>{sample.name}</strong><span className={styles.sampleLabel}>نمونه</span></div>)}
                  </div>;
                })}
              </div>)}
            </div>
          </div> : <>
          <div className={styles.teamHeader} style={{ gridTemplateColumns: `48px repeat(${teamMembers.length}, minmax(130px, 1fr))`, minWidth: `${48 + teamMembers.length * 130}px` }}>
            <div />
            {teamMembers.map(member => <div className={styles.member} key={member.id}>
              <span className={`${styles.memberAvatar} ${member.id === 'demo' ? styles.demoAvatar : ''}`}>{member.imageName ? <Image src={imageUrl(member.imageName)} alt="" fill sizes="59px" unoptimized /> : member.initials}</span>
              <strong>{member.name}</strong>
            </div>)}
          </div>
          <div className={styles.schedule} style={{ minWidth: `${48 + teamMembers.length * 130}px` }}>
            <div className={styles.timeLabels}>{Array.from({ length: 24 }, (_, hour) => <div className={styles.hourLabel} key={hour}><strong>{String(hour % 12 || 12).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])}:۰۰</strong><span>{hour < 12 ? 'ق.ظ' : 'ب.ظ'}</span></div>)}</div>
            <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${teamMembers.length}, minmax(130px, 1fr))` }}>{teamMembers.map(member => <div className={styles.column} key={member.id} aria-label={`نوبت‌های ${member.name}`}>{appointments.filter(item => item.memberKey === member.id && tehranDateKey(item.startsAt) === selectedDateKey).map(item => <div key={item.id} className={styles.calendarAppointment} style={{ top: `${appointmentMinutes(item.startsAt) / 60 * 96}px`, height: `${Math.max(30, (new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60_000 / 60 * 96)}px` }} title={`${item.customerName} · ${item.serviceName}${item.isTest ? ' (آزمایشی)' : ''}\n${item.firstVisit ? 'اولین مراجعه' : 'مراجعه مجدد'}${item.note ? `\nتوضیحات: ${item.note}` : ''}`}><strong>{item.customerName}</strong><span>{item.serviceName}</span><span>{appointmentTime(item.startsAt)}{item.isTest && ' · آزمایشی'}</span></div>)}</div>)}</div>
            {today && <div className={styles.currentTime} style={{ top: `${minutes / 60 * 96}px` }}><span>{now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>}
          </div>
          </>}
        </div>
      </section>
    </BusinessWorkspace>
  );
}
