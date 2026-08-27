// src/components/features/auth/UserFlowCard.tsx
// کارت انتخاب نوع حساب کاربری در صفحه ورود/ثبت‌نام

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { UserFlow } from './flows';

interface UserFlowCardProps {
  flow: UserFlow;
}

export const UserFlowCard = ({ flow }: UserFlowCardProps) => {
  return (
    <Link
      href={flow.href}
      className="group flex items-center justify-between gap-4 w-full px-6 py-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-400 hover:shadow-md transition-all duration-200"
    >
      <div className="flex flex-col gap-1 text-right">
        <span className="text-[17px] font-bold text-gray-900">{flow.title}</span>
        <span className="text-[15px] text-gray-500">{flow.description}</span>
      </div>

      {/* فلش جهت‌دار: در حالت راست‌چین به سمت چپ اشاره می‌کند */}
      <ArrowLeft className="w-6 h-6 text-gray-800 shrink-0 transition-transform duration-200 group-hover:-translate-x-1" />
    </Link>
  );
};
