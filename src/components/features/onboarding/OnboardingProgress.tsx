// src/components/features/onboarding/OnboardingProgress.tsx
'use client';

import { usePathname } from 'next/navigation';

const STEPS = [
  '/onboarding/business-name',
  '/onboarding/business-category',
  '/onboarding/business-location',
  '/onboarding/team',
  '/onboarding/complete',
];

const TOTAL = STEPS.length; // 5 قسمت

export function OnboardingProgress() {
  const pathname = usePathname();
  const idx = STEPS.findIndex((s) => pathname.startsWith(s));
  const filledCount = idx >= 0 ? idx + 1 : 0;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '10px',          // فاصله از بالای صفحه
        left: '16px',
        right: '16px',
        display: 'flex',
        flexDirection: 'row', // در RTL layout خودکار معکوس می‌شه
        gap: '4px',
        zIndex: 9999,
        direction: 'rtl',     // قسمت اول (پر) از سمت راست
      }}
    >
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '3px',
            borderRadius: '9999px',
            backgroundColor: i < filledCount ? '#4f46e5' : '#e5e7eb',
            transition: 'background-color 300ms ease',
          }}
        />
      ))}
    </div>
  );
}
