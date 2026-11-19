'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export function ClientForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true; setPending(true); setError('');
    try {
      const response = await fetch('/api/clients', { method: 'POST', body: new FormData(event.currentTarget) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || 'ذخیره مشتری انجام نشد.'); return; }
      router.push('/clients/list'); router.refresh();
    } catch { setError('اتصال برقرار نشد. دوباره تلاش کنید.'); }
    finally { saving.current = false; setPending(false); }
  }
  return <form onSubmit={submit} noValidate aria-busy={pending}>{children}{(error || pending) && <div role={error ? 'alert' : 'status'} className={styles.saveStatus}>{error || 'در حال ذخیره اطلاعات مشتری…'}</div>}</form>;
}
