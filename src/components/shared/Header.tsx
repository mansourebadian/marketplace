'use client'; // این خط برای استفاده از Hookها در Next.js App Router الزامی است

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Globe, ArrowLeft } from 'lucide-react';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // منطق بسته شدن منو هنگام کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-transparent z-50">
      <div className="max-w-[1300px] mx-auto px-4 h-full flex items-center justify-between">
        
        {/* لوگو */}
        <div className="text-2xl font-bold tracking-tighter text-black cursor-pointer" dir="ltr">
          fresha
        </div>

        {/* نویگیشن دسکتاپ */}
        <div className="hidden md:flex items-center gap-3">
          <button className="text-[15px] font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-4 py-2.5 rounded-full transition-colors">
            ورود
          </button>
          
          <button className="text-[15px] font-semibold text-gray-900 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-5 py-2.5 rounded-full transition-all shadow-sm cursor-pointer">
            لیست کسب‌وکارها
          </button>
          
          {/* کانتینر دکمه منو و دراپ‌داون */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 text-gray-900 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-[15px] font-semibold px-4 py-2.5 rounded-full transition-all shadow-sm cursor-pointer"
            >
              <span>منو</span>
              <Menu className="w-5 h-5 stroke-[1.5]" />
            </button>

            {/* دراپ‌داون (Dropdown Menu) */}
            {isMenuOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-[280px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 py-3 z-50 flex flex-col">
                
                {/* بخش مشتریان */}
                <div className="px-3 pb-2">
                  <h3 className="text-[15px] font-bold text-gray-900 px-3 mb-2">برای مشتریان</h3>
                  
                  <ul className="flex flex-col gap-0.5">
                    <li>
                      <button className="w-full text-right px-3 py-2.5 text-[15px] text-purple-700 font-medium hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                        ورود یا ثبت‌نام
                      </button>
                    </li>
                    <li>
                      <button className="w-full text-right px-3 py-2.5 text-[15px] text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                        دانلود اپلیکیشن
                      </button>
                    </li>
                    <li>
                      <button className="w-full text-right px-3 py-2.5 text-[15px] text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                        راهنما و پشتیبانی
                      </button>
                    </li>
                    <li>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[15px] text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                        <Globe className="w-[18px] h-[18px] stroke-[1.5]" />
                        <span>فارسی (ایران)</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* خط جداکننده */}
                <div className="h-px bg-gray-200 my-1 w-full"></div>

                {/* بخش کسب‌وکارها */}
                <div className="px-3 pt-2">
                  <button className="w-full flex items-center justify-between px-3 py-2.5 text-[15px] font-bold text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                    <span>برای کسب‌وکارها</span>
                    {/* استفاده از ArrowLeft به دلیل راست‌چین بودن سایت */}
                    <ArrowLeft className="w-5 h-5 stroke-[1.5] text-gray-900" />
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* آیکون منوی موبایل */}
        <button className="md:hidden flex items-center justify-center p-2 cursor-pointer bg-white border border-gray-300 rounded-full shadow-sm">
          <Menu className="w-6 h-6 text-black stroke-[1.5]" />
        </button>

      </div>
    </header>
  );
};
