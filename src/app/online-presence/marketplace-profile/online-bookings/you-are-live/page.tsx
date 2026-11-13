import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import CompletionActions from './completion-actions';
import styles from './you-are-live.module.css';

export const metadata: Metadata = { title: 'وضعیت انتشار پروفایل | آرینو' };

export default function YouAreLivePage() {
  return <main className={styles.page} dir="rtl">
    <section className={styles.content} aria-labelledby="status-title">
      <span className={styles.icon} aria-hidden="true"><Check size={37} strokeWidth={1.7} /></span>
      <h1 id="status-title">مراحل آماده‌سازی پروفایل شما تکمیل شد</h1>
      <p>انتشار پروفایل و فعال‌سازی رزرو آنلاین هنوز در آرینو انجام نشده است.</p>
      <CompletionActions />
    </section>
  </main>;
}
