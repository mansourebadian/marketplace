// src/app/page.tsx
import { Header } from '@/components/shared/Header';
import { Hero } from '@/components/features/Hero';

export default function HomePage() {
  return (
    <main className="min-h-screen relative">
      <Header />
      <Hero />
      {/* سایر بخش‌های صفحه مانند کامپوننت Recommended در اینجا قرار می‌گیرند */}
    </main>
  );
}
