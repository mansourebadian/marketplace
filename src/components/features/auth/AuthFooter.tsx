// src/components/features/auth/AuthFooter.tsx
// فوتر صفحه ورود: انتخاب زبان و لینک پشتیبانی

import { Globe, CircleHelp } from 'lucide-react';

export const AuthFooter = () => {
  return (
    <footer className="flex items-center justify-center gap-8 py-6">
      <button className="flex items-center gap-2 text-[15px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
        <Globe className="w-5 h-5" />
        فارسی (ایران)
      </button>

      <button className="flex items-center gap-2 text-[15px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
        <CircleHelp className="w-5 h-5" />
        راهنما و پشتیبانی
      </button>
    </footer>
  );
};
