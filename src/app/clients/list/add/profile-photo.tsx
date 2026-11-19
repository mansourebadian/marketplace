'use client';

import { useEffect, useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import styles from './page.module.css';

export function ProfilePhoto() {
  const [preview, setPreview] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <label className={styles.photoPicker} title="انتخاب تصویر مشتری"><span className={styles.avatar}>{preview ? <span className={styles.photoPreview} style={{ backgroundImage: `url(${preview})` }} /> : <UserRound size={55} strokeWidth={1.6} />}</span><span className={styles.photoEdit}><Camera size={16} /></span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-label="انتخاب تصویر مشتری" onChange={event => { const file = event.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : ''); }} /></label>;
}
