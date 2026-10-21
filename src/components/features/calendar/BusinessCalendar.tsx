'use client';

import { useEffect, useRef, useState } from 'react';
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

function monthStart(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - Number(persianDay.format(date)) + 1);
  start.setHours(12, 0, 0, 0);
  return start;
}

export function BusinessCalendar({ ownerName, businessName }: { ownerName: string; businessName: string }) {
  const [date, setDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [showDemo, setShowDemo] = useState(true);
  const [view, setView] = useState<CalendarView>('Day');
  const [viewOpen, setViewOpen] = useState(false);
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
  const teamMembers = [
    { id: 'owner', name: ownerName, initials },
    ...(showDemo ? [{ id: 'demo', name: 'وندی اسمیت (نمونه)', initials: 'و س' }] : []),
  ];
  const dateRange = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', year: 'numeric' }).formatRange(rangeDays[0], rangeDays[rangeDays.length - 1]);
  const columns = teamMembers.map(member => member.name);
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
            <label className={styles.select}><select aria-label="فیلتر اعضای تیم" value={showDemo ? 'all' : 'owner'} onChange={event => setShowDemo(event.target.value === 'all')}><option value="all">اعضای تیم</option><option value="owner">{ownerName}</option></select><ChevronDown size={15} /></label>
            <button aria-label={showDemo ? 'پنهان کردن عضو نمونه' : 'نمایش عضو نمونه'} onClick={() => setShowDemo(value => !value)}><SlidersHorizontal size={19} /></button>
          </div>
          <div className={styles.toolbarGroup}>
            <button aria-label="به‌روزرسانی تقویم" onClick={() => { setNow(new Date()); }}><RefreshCw size={19} /></button>
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
                  <span className={`${styles.memberAvatar} ${member.id === 'demo' ? styles.demoAvatar : ''}`}>{member.initials}</span>
                  <strong title={member.name}>{member.name}</strong>
                </div>
                {rangeDays.map(day => {
                  const isToday = day.toDateString() === now.toDateString();
                  const samples = member.id === 'owner'
                    ? [{ time: '۹:۰۰ – ۹:۴۰', name: 'جان دو' }, { time: '۱۱:۰۰ – ۱۱:۵۰', name: 'جین دو' }]
                    : [{ time: '۱۰:۰۰ – ۱۰:۳۰', name: 'جک دو' }];
                  return <div key={day.toDateString()} role="cell" className={`${styles.threeDayCell} ${isToday ? styles.hatchedDay : ''}`} aria-label={`${member.name}، ${day.toLocaleDateString('fa-IR', { dateStyle: 'full' })}`}>
                    {isToday && showDemo && samples.map(sample => <div key={sample.name} className={styles.appointmentStrip}><bdi>{view === 'Week' ? sample.time.split(' – ')[0] : sample.time}</bdi><strong>{sample.name}</strong><span className={styles.sampleLabel}>نمونه</span></div>)}
                  </div>;
                })}
              </div>)}
            </div>
          </div> : <>
          <div className={styles.teamHeader} style={{ gridTemplateColumns: `48px repeat(${columns.length}, minmax(130px, 1fr))` }}>
            <div />
            {columns.map((name, index) => <div className={styles.member} key={name}>
              <span className={`${styles.memberAvatar} ${index === 1 ? styles.demoAvatar : ''}`}>{index === 0 ? initials : 'و س'}</span>
              <strong>{name}</strong>
            </div>)}
          </div>
          <div className={styles.schedule}>
            <div className={styles.timeLabels}>{Array.from({ length: 24 }, (_, hour) => <div className={styles.hourLabel} key={hour}><strong>{String(hour % 12 || 12).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])}:۰۰</strong><span>{hour < 12 ? 'ق.ظ' : 'ب.ظ'}</span></div>)}</div>
            <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(130px, 1fr))` }}>{columns.map(name => <div className={styles.column} key={name} aria-label={`${name}، بدون نوبت`} />)}</div>
            {today && <div className={styles.currentTime} style={{ top: `${minutes / 60 * 96}px` }}><span>{now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>}
          </div>
          </>}
        </div>
      </section>
    </BusinessWorkspace>
  );
}
