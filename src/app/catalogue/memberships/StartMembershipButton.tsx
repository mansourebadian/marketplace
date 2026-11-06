'use client';

import { useState } from 'react';
import styles from './memberships.module.css';

export function StartMembershipButton() {
  const [showNotice, setShowNotice] = useState(false);

  return <div className={styles.action}>
    <button type="button" className={styles.startButton} onClick={() => setShowNotice(true)}>شروع کنید</button>
    {showNotice && <p className={styles.notice} role="status">امکان ثبت عضویت هنوز در دسترس نیست.</p>}
  </div>;
}
