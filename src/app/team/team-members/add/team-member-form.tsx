'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProfilePhoto } from './profile-photo';
import { PersianDateField } from './persian-date-field';
import { MemberServices } from './member-services';
import styles from './team-member-form.module.css';

const colors = ['#9de6f3', '#9acbf0', '#9dbffb', '#aab8fa', '#b7a7f9', '#c7a3f1', '#e49cee', '#f29ce4', '#fa9fb8', '#ff9b79', '#ffbe69', '#ffd363', '#ffeb73', '#e7ef80', '#a2e3bc', '#6bd1c6', '#8ce4e9'];

type Member = { id: string; firstName: string; lastName: string | null; email: string; phone: string | null; additionalPhone: string | null; country: string | null; birthday: string | null; gender: string | null; pronouns: string | null; color: string; jobTitle: string | null; startDate: string | null; endDate: string | null; employmentType: string | null; externalId: string | null; notes: string | null; imageName: string | null };

export function AddTeamMember({ member, initialSection = 'profile' }: { member?: Member; initialSection?: 'profile' | 'services' }) {
  const [section, setSection] = useState(initialSection);
  const [servicesVisited, setServicesVisited] = useState(initialSection === 'services');
  const [servicesSaving, setServicesSaving] = useState(false);
  const changeSection = (next: 'profile' | 'services') => { setSection(next); if (next === 'services') setServicesVisited(true); const url = new URL(window.location.href); if (next === 'services') url.searchParams.set('section', 'services'); else url.searchParams.delete('section'); window.history.replaceState(null, '', url); };
  const isOwner = member?.id === 'owner';
  const [color, setColor] = useState(member?.color || colors[0]);
  const [notes, setNotes] = useState(member?.notes || '');
  const [photoToken, setPhotoToken] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || uploading) return;
    setError(''); setSaving(true);
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch(member ? `/api/team/members/${encodeURIComponent(member.id)}` : '/api/team/members', { method: member ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, color, photoToken }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ثبت عضو تیم انجام نشد.');
      router.push('/team/team-members');
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'ثبت عضو تیم انجام نشد.'); }
    finally { setSaving(false); }
  };

  return <main dir="rtl" className={styles.page}>
    <header className={styles.header}><div className={styles.headerInner}><strong>{member ? `ویرایش ${member.firstName}` : 'افزودن عضو تیم'}</strong><div><Link className={styles.close} href="/team/team-members">بستن</Link><button className={styles.add} type="submit" form={section === 'services' ? 'member-services-form' : 'team-member-form'} disabled={uploading || saving || servicesSaving}>{saving || servicesSaving ? 'در حال ذخیره…' : member ? 'ذخیره' : 'افزودن'}</button></div></div></header>
    <div className={styles.container}><h1>{member ? `ویرایش ${member.firstName}` : 'افزودن عضو تیم'}</h1><div className={styles.layout}>
      <nav className={styles.sidebar} aria-label="بخش‌های عضو تیم">
        <h2>اطلاعات شخصی</h2><button type="button" aria-current={section === 'profile' ? 'page' : undefined} onClick={() => changeSection('profile')}>پروفایل</button><button type="button" disabled>آدرس‌ها</button><button type="button" disabled>مخاطبین اضطراری</button>
        <h2>فضای کاری</h2><button type="button" disabled={!member} aria-current={section === 'services' ? 'page' : undefined} onClick={() => changeSection('services')}>خدمات</button><button type="button" disabled>موقعیت‌ها</button><button type="button" disabled>تنظیمات</button>
        <h2>پرداخت</h2><button type="button" disabled>دستمزد و ساعات کاری</button><button type="button" disabled>کمیسیون‌ها</button><button type="button" disabled>پرداخت حقوق</button>
      </nav>
      <form id="team-member-form" hidden={section !== 'profile'} className={styles.form} onSubmit={submit}>
        <section id="profile"><h2>پروفایل</h2><p className={styles.subtitle}>اطلاعات شخصی عضو تیم خود را مدیریت کنید</p>
          {!isOwner && <ProfilePhoto initialImageName={member?.imageName} onUploaded={setPhotoToken} onUploadingChange={setUploading} />}
          <div className={styles.grid}>
            <label>نام <span>*</span><input name="firstName" defaultValue={member?.firstName || ''} required maxLength={100} /></label>
            <label>نام خانوادگی<input name="lastName" defaultValue={member?.lastName || ''} maxLength={100} /></label>
            <label>ایمیل {!isOwner && <span>*</span>}<input name="email" defaultValue={member?.email || ''} type="email" disabled={isOwner} required={!isOwner} maxLength={320} dir="ltr" /></label>
            <label>شماره تلفن<input name="phone" defaultValue={member?.phone || ''} disabled={isOwner} type="tel" dir="ltr" /></label>
            {!isOwner && <label>شماره تلفن اضافی<input name="additionalPhone" defaultValue={member?.additionalPhone || ''} type="tel" dir="ltr" /></label>}
            <label>کشور<select name="country" defaultValue={member?.country || ''}><option value="">انتخاب کشور</option><option>ایران</option><option>بریتانیا</option><option>ایالات متحده</option></select></label>
            <PersianDateField name="birthday" initialValue={member?.birthday} label="تاریخ تولد" /><div />
            <label>جنسیت<select name="gender" defaultValue={member?.gender || ''}><option value="">انتخاب کنید</option><option>زن</option><option>مرد</option><option>سایر</option><option>ترجیح می‌دهم نگویم</option></select></label>
            {!isOwner && <label>ضمیر<select name="pronouns" defaultValue={member?.pronouns || ''}><option value="">انتخاب کنید</option><option>او</option><option>سایر</option><option>ترجیح می‌دهم نگویم</option></select></label>}
          </div>
        </section>
        {!isOwner && <><section className={styles.section}><h2>رنگ تقویم</h2><p className={styles.subtitle}>رنگ نمایش عضو تیم را انتخاب کنید</p><div className={styles.colors}>{colors.map((item, index) => <button key={item} type="button" className={color === item ? styles.colorSelected : ''} style={{ backgroundColor: item }} aria-label={`رنگ ${index + 1}`} aria-pressed={color === item} onClick={() => setColor(item)} />)}</div></section>
        <section className={styles.section}><div className={styles.grid}><label>عنوان شغلی<input name="jobTitle" defaultValue={member?.jobTitle || ''} /><small>در صفحهٔ رزرو آنلاین به مشتریان نمایش داده می‌شود.</small></label></div></section>
        <section className={styles.section}><h2>جزئیات کاری</h2><p className={styles.subtitle}>تاریخ شروع و جزئیات همکاری عضو تیم را مدیریت کنید</p><div className={styles.grid}>
          <PersianDateField name="startDate" initialValue={member?.startDate} label="تاریخ شروع" /><div />
          <PersianDateField name="endDate" initialValue={member?.endDate} label="تاریخ پایان" /><div />
          <label>نوع همکاری<select name="employmentType" defaultValue={member?.employmentType || ''}><option value="">انتخاب کنید</option><option>تمام‌وقت</option><option>پاره‌وقت</option><option>قراردادی</option></select></label>
          <label>شناسه عضو تیم<input name="externalId" defaultValue={member?.externalId || ''} /><small>شناسه مورد استفاده در سیستم‌های دیگر، مانند حقوق و دستمزد</small></label>
          <label className={styles.full}><span className={styles.noteLabel}>یادداشت <small>{notes.length.toLocaleString('fa-IR')}/۱۰۰۰</small></span><textarea name="notes" maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="یک یادداشت خصوصی برای این عضو تیم اضافه کنید" /></label>
        </div></section>
        </>}
        {error && <p className={styles.photoError} role="alert">{error}</p>}
      </form>
      {member && servicesVisited && <div hidden={section !== 'services'}><MemberServices memberId={member.id} onSavingChange={setServicesSaving} /></div>}
    </div></div>
  </main>;
}
