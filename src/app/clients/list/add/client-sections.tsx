'use client';

import { useState, type ReactNode } from 'react';
import { CirclePlus } from 'lucide-react';
import { AddressDialog, type AddressDraft } from './address-dialog';
import styles from './page.module.css';

export function ClientSections({ children }: { children: ReactNode }) {
  const [section, setSection] = useState<'profile' | 'addresses' | 'emergency' | 'settings'>('profile');
  const [addressOpen, setAddressOpen] = useState(false);
  const [addresses, setAddresses] = useState<AddressDraft[]>([]);
  return <div className={styles.layout}>
    <nav className={styles.menu} aria-label="بخش‌های اطلاعات مشتری">
      <h2>اطلاعات شخصی</h2>
      <button type="button" aria-current={section === 'profile' ? 'page' : undefined} onClick={() => setSection('profile')}>پروفایل</button>
      <button type="button" aria-current={section === 'addresses' ? 'page' : undefined} onClick={() => setSection('addresses')}>آدرس‌ها</button>
      <button type="button" aria-current={section === 'emergency' ? 'page' : undefined} onClick={() => setSection('emergency')}>تماس‌های اضطراری</button><hr />
      <button type="button" aria-current={section === 'settings' ? 'page' : undefined} onClick={() => setSection('settings')}>تنظیمات</button>
    </nav>
    <div className={styles.content}>
      <div hidden={section !== 'profile'}>{children}</div>
      <section className={styles.section} hidden={section !== 'addresses'} aria-labelledby="addresses-title">
        <h2 id="addresses-title">آدرس‌ها</h2><p>آدرس‌های مشتری را مدیریت کنید.</p>
        <button type="button" className={styles.addAddress} onClick={() => setAddressOpen(true)}><CirclePlus size={19} /> افزودن آدرس جدید</button>
        <input type="hidden" name="addresses" value={JSON.stringify(addresses)} />
        {addresses.length > 0 && <div className={styles.addressList}>{addresses.map((address, index) => <article className={styles.addressCard} key={index}><strong>{address.name}</strong><p>{[address.address, address.apartment, address.district, address.city, address.region, address.postalCode].filter(Boolean).join('، ')}</p><button type="button" className={styles.addAddress} onClick={() => setAddresses(current => current.filter((_, position) => position !== index))}>حذف</button></article>)}</div>}
      </section>
      <div hidden={section !== 'emergency'}>
        <section className={styles.section} aria-labelledby="emergency-title">
          <h2 id="emergency-title">تماس‌های اضطراری</h2>
          <p>اطلاعات تماس افراد موردنظر مشتری برای مواقع اضطراری را وارد کنید.</p>
          {([{ key: 'primary', title: 'مخاطب اصلی' }, { key: 'secondary', title: 'مخاطب دوم' }] as const).map(contact => <div className={styles.emergencyGroup} key={contact.key}>
            <h3>{contact.title}</h3>
            <div className={styles.grid}>
              <label>نام و نام خانوادگی<input name={`${contact.key}ContactName`} maxLength={200} placeholder="مثلاً سارا احمدی" autoComplete="off" /></label>
              <label>نسبت با مشتری<input name={`${contact.key}ContactRelationship`} maxLength={100} placeholder="مثلاً والدین" autoComplete="off" /></label>
              <label>ایمیل<input name={`${contact.key}ContactEmail`} type="email" maxLength={320} placeholder="example@domain.com" dir="ltr" autoComplete="off" /></label>
              <label>شماره تماس<div className={styles.phone}><select name={`${contact.key}ContactCountryCode`} aria-label={`کد کشور ${contact.title}`} defaultValue="+98"><option value="+98">+98</option></select><input name={`${contact.key}ContactPhone`} type="tel" maxLength={32} placeholder="912 345 6789" dir="ltr" autoComplete="off" /></div></label>
            </div>
          </div>)}
        </section>
      </div>
      <div hidden={section !== 'settings'}>
        <section className={styles.section} aria-labelledby="client-settings-title">
          <h2 id="client-settings-title">تنظیمات</h2>
          <fieldset className={styles.settingsGroup}>
            <legend>اعلان‌های مشتری</legend>
            <p>روش‌های ارسال اعلان به این مشتری را انتخاب کنید.</p>
            <label><input type="checkbox" name="notificationEmail" defaultChecked /> ارسال اعلان از طریق ایمیل</label>
            <label><input type="checkbox" name="notificationSms" defaultChecked /> ارسال اعلان از طریق پیامک</label>
            <label><input type="checkbox" name="notificationBale" defaultChecked /> ارسال اعلان از طریق بله</label>
          </fieldset>
          <fieldset className={styles.settingsGroup}>
            <legend>پیام‌های بازاریابی</legend>
            <p>روش‌های ارسال پیام بازاریابی را مطابق رضایت مشتری انتخاب کنید.</p>
            <label><input type="checkbox" name="marketingEmail" /> ارسال پیام از طریق ایمیل</label>
            <label><input type="checkbox" name="marketingSms" /> ارسال پیام از طریق پیامک</label>
            <label><input type="checkbox" name="marketingBale" /> ارسال پیام از طریق بله</label>
          </fieldset>
        </section>
      </div>
    </div>
    {addressOpen && <AddressDialog onClose={() => setAddressOpen(false)} onContinue={address => { setAddresses(current => [...current, address]); setAddressOpen(false); }} />}
  </div>;
}
