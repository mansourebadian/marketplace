// src/components/features/auth/flows.ts
// تعریف متمرکز مسیرهای ورود (مشتری / متخصص) برای صفحه انتخاب نوع حساب

export interface UserFlow {
  id: string;
  title: string;
  description: string;
  href: string;
}

export const USER_FLOWS: UserFlow[] = [
  {
    id: 'customers',
    title: 'فرِشا برای مشتریان',
    description: 'رزرو سالن‌ها و اسپاهای نزدیک شما',
    href: '/auth/customer',
  },
  {
    id: 'professionals',
    title: 'فرِشا برای متخصصان',
    description: 'مدیریت و رشد کسب‌وکار شما',
    href: '/auth/business',
  },
];
