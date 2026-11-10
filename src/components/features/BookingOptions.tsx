'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift, UserRound, UsersRound } from 'lucide-react';

const options = [
  { title: 'رزرو نوبت', description: 'برای خودتان خدمات رزرو کنید', icon: UserRound },
  { title: 'رزرو گروهی', description: 'برای خودتان و همراهانتان نوبت بگیرید', icon: UsersRound },
  { title: 'ارسال هدیه', description: 'خودتان یا دوستانتان را برای مراجعه بعدی مهمان کنید', icon: Gift },
];

export function BookingOptions({ servicesHref }: { servicesHref: string }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="mx-auto mt-12 w-full max-w-[696px] sm:mt-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight sm:text-[40px]">یک گزینه انتخاب کنید</h1>
      <div className="space-y-3">
        {options.map(({ title, description, icon: Icon }, index) => (
          <div key={title}>
            {index === 2 && <h2 className="mb-3 mt-10 text-lg font-bold">بیشتر</h2>}
            <Option href={index === 0 ? servicesHref : undefined} onClick={() => setSelected(title)} className="flex min-h-[82px] w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-right transition-colors hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
              <span className="flex flex-col gap-1"><span className="font-semibold">{title}</span><span className="text-sm text-gray-500">{description}</span></span>
              <Icon aria-hidden="true" className="h-6 w-6 shrink-0" strokeWidth={1.7} />
            </Option>
          </div>
        ))}
      </div>
      {selected && <p role="status" className="mt-5 rounded-xl bg-white px-5 py-4 text-sm text-gray-600">امکان {selected} هنوز فعال نشده است.</p>}
    </div>
  );
}

function Option({ href, onClick, className, children }: { href?: string; onClick: () => void; className: string; children: React.ReactNode }) {
  return href ? <Link href={href} className={className}>{children}</Link> : <button type="button" onClick={onClick} className={className}>{children}</button>;
}
