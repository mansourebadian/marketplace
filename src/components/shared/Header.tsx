'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Globe, LogIn, Smartphone, Briefcase, PlusCircle } from 'lucide-react';
import { CompactSearchBar } from './CompactSearchBar';
import Link from 'next/link';

interface HeaderProps {
  hasSearch?: boolean;
}

export const Header = ({ hasSearch = false }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // مدیریت بستن منو هنگام کلیک خارج از آن
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 md:h-20 z-50 transition-colors ${hasSearch ? 'bg-white border-b border-gray-200 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between">
        
        {/* لوگو */}
        <Link href="/" className={`text-2xl font-bold tracking-tighter cursor-pointer shrink-0 ${hasSearch ? 'text-black' : 'text-gray-900'}`} dir="ltr">
          fresha
        </Link>

        {/* نوار جستجوی فشرده (فقط در صفحات داخلی) */}
        {hasSearch && <CompactSearchBar />}

        {/* نویگیشن دسکتاپ و دکمه‌ها */}
        <div className="hidden md:flex items-center gap-4 shrink-0 relative" ref={menuRef}>
          
          <button className={`font-medium text-[15px] hover:underline transition-all ${hasSearch ? 'text-gray-700' : 'text-gray-800'}`}>
            کسب‌وکارتان را اضافه کنید
          </button>
          
          <button className="font-semibold text-[15px] bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors shadow-sm">
            ورود / ثبت‌نام
          </button>
          
          {/* دکمه باز کردن منو */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center justify-center p-2.5 cursor-pointer rounded-full transition-colors ${hasSearch ? 'hover:bg-gray-100' : 'hover:bg-black/5'}`}
          >
            <Menu className="w-6 h-6 text-black stroke-[1.5]" />
          </button>

          {/* منوی Dropdown */}
          {isMenuOpen && (
            <div className="absolute top-14 left-0 w-[280px] bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] py-3 flex flex-col z-50">
              
              {/* بخش مشتریان */}
              <div className="px-4 py-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">مشتریان</h3>
                <button className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors text-right text-[15px] font-medium">
                  <LogIn className="w-5 h-5 text-gray-500" />
                  ورود یا ثبت‌نام
                </button>
                <button className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors text-right text-[15px] font-medium">
                  <Smartphone className="w-5 h-5 text-gray-500" />
                  دانلود اپلیکیشن Fresha
                </button>
              </div>

              <div className="h-[1px] bg-gray-100 my-1 mx-4"></div>

              {/* بخش کسب‌وکارها */}
              <div className="px-4 py-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">کسب‌وکارها</h3>
                <button className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors text-right text-[15px] font-medium">
                  <PlusCircle className="w-5 h-5 text-gray-500" />
                  ثبت کسب‌وکار جدید
                </button>
                <button className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors text-right text-[15px] font-medium">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                  نرم‌افزار مدیریت Fresha
                </button>
              </div>

              <div className="h-[1px] bg-gray-100 my-1 mx-4"></div>

              {/* تنظیمات زبان و منطقه */}
              <div className="px-4 py-2">
                <button className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors text-[15px] font-medium">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-500" />
                    فارسی (ایران)
                  </div>
                  <span className="text-gray-400 text-sm">تغییر</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* منوی موبایل */}
        <button className="md:hidden flex items-center justify-center p-2.5 cursor-pointer bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors">
          <Menu className="w-6 h-6 text-black stroke-[1.5]" />
        </button>

      </div>
    </header>
  );
};
