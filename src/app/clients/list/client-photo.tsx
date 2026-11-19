'use client';

import { useState, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import styles from './clients-list.module.css';

export function ClientPhoto({ id, name, hasPhoto, editable }: { id: string; name: string; hasPhoto: boolean; editable: boolean }) {
  const [version, setVersion] = useState(hasPhoto ? 1 : 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function change(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const form = new FormData(); form.set('photo', file); setPending(true); setError('');
    try { const response = await fetch(`/api/clients/${encodeURIComponent(id)}/photo`, { method: 'PUT', body: form }); if (!response.ok) { const result = await response.json(); setError(result.error || 'تغییر تصویر انجام نشد.'); return; } setVersion(Date.now()); }
    catch { setError('تغییر تصویر انجام نشد.'); } finally { setPending(false); }
  }
  const avatar = <span className={styles.avatar} style={version ? { backgroundImage: `url(/api/clients/${encodeURIComponent(id)}/photo?v=${version})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{!version && name.trim().charAt(0).toUpperCase()}</span>;
  if (!editable) return avatar;
  return <div className={styles.photoControl}><label title="تغییر تصویر مشتری">{avatar}<span className={styles.photoCamera}><Camera size={12} /></span><input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`تغییر تصویر ${name}`} onChange={change} disabled={pending} /></label>{error && <span role="alert" className={styles.photoError}>{error}</span>}</div>;
}
