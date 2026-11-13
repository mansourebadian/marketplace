'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Accessibility, ArrowLeft, ArrowRight, Baby, Bath, BusFront, CarFront, Dog, LockKeyhole, Mars, ShowerHead, Users, Venus, Waves } from 'lucide-react';
import shared from '../essentials-overview/essentials.module.css';
import { featureGroups } from './options';
import { saveFeatures } from './save-features';
import styles from './features.module.css';

const icons = { car: CarFront, bus: BusFront, shower: ShowerHead, lock: LockKeyhole, bath: Bath, waves: Waves, dog: Dog, users: Users, baby: Baby, accessibility: Accessibility, mars: Mars, venus: Venus };

export default function FeaturesForm({ initialFeatures }: { initialFeatures: string[] }) {
  const [selected, setSelected] = useState(initialFeatures);
  const [state, action, pending] = useActionState(saveFeatures, { error: '' });
  return <main className={shared.page} dir="rtl">
    <form action={action}>
      <header className={`${shared.header} ${styles.header}`}>
        <div className={shared.progress}><span /><span /><span /></div>
        <div className={shared.navigation}>
          <Link className={shared.back} href="/online-presence/marketplace-profile/images" aria-label="بازگشت"><ArrowRight size={20} /></Link>
          <div className={shared.actions}>
            <button className={shared.close} type="submit" name="destination" value="exit" disabled={pending}>{pending ? 'در حال ذخیره...' : 'ذخیره و خروج'}</button>
            <button className={shared.continue} type="submit" name="destination" value="about" disabled={pending}>ادامه <ArrowLeft size={20} /></button>
          </div>
        </div>
      </header>
      <section className={styles.content}>
        <h1>پروفایل خود را متمایز کنید</h1>
        <p className={styles.description}>با انتخاب امکانات و ویژگی‌های کسب‌وکار خود، به مشتریان نشان دهید چه چیزی شما را متمایز می‌کند. هر تعداد گزینه که مناسب است انتخاب کنید.</p>
        {state.error && <p className={styles.error} role="alert">{state.error}</p>}
        {featureGroups.map(group => <fieldset key={group.title} className={styles.group}>
          <legend>{group.title}</legend>
          <div className={styles.options}>{group.options.map(option => {
            const Icon = 'icon' in option ? icons[option.icon] : null;
            return <label key={option.id} className={`${styles.option} ${selected.includes(option.id) ? styles.selected : ''}`}>
              <input type="checkbox" name="features" value={option.id} checked={selected.includes(option.id)} onChange={event => setSelected(current => event.target.checked ? [...current, option.id] : current.filter(id => id !== option.id))} />
              {Icon && <Icon size={17} strokeWidth={1.6} aria-hidden="true" />}{option.label}
            </label>;
          })}</div>
        </fieldset>)}
      </section>
    </form>
  </main>;
}
