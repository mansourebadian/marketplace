'use client';

import { useActionState } from 'react';
import { completeProfile } from './complete-profile';
import styles from './you-are-live.module.css';

export default function CompletionActions() {
  const [state, action, pending] = useActionState(completeProfile, { error: '' });
  return <form action={action}>
    <div className={styles.actions}>
      <button className={styles.done} type="submit" disabled={pending}>{pending ? 'در حال ذخیره...' : 'پایان'}</button>
      <button className={styles.preview} type="button" disabled>پیش‌نمایش پروفایل</button>
    </div>
    {state.error && <p role="alert">{state.error}</p>}
  </form>;
}
