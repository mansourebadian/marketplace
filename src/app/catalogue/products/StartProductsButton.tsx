'use client';

import { useState } from 'react';
import styles from './products.module.css';

export function StartProductsButton() {
  const [showNotice, setShowNotice] = useState(false);
  return <div className={styles.action}>
    <button type="button" className={styles.startButton} onClick={() => setShowNotice(true)}>شروع کنید</button>
    {showNotice && <p className={styles.notice} role="status">امکان ثبت محصول هنوز در دسترس نیست.</p>}
  </div>;
}
