import { Header } from '@/components/shared/Header';
import { Hero } from '@/components/features/Hero';
import { SalonSections } from '@/components/features/SalonSections';
import styles from './home.module.css';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen relative">
      <Header />
      <div className={styles.homeContent}>
        <Hero />
        <SalonSections />
      </div>
    </main>
  );
}

