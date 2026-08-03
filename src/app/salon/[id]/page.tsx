"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Share, Heart, ChevronRight, Star, Clock, MapPin, ChevronDown } from 'lucide-react';

export default function SalonDetailPage() {
  // استیت برای تشخیص وضعیت اسکرول
  const [isScrolled, setIsScrolled] = useState(false);

  // افکت برای رصد کردن میزان اسکرول صفحه
  useEffect(() => {
    const handleScroll = () => {
      // اگر کاربر بیش از ۳۰۰ پیکسل اسکرول کند، کارت گسترده می‌شود
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // پاکسازی event listener هنگام خروج از کامپوننت
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-white pb-20">
      <Header hasSearch={true} />

      <div className="pt-24 md:pt-28 max-w-[1200px] mx-auto px-4">
        
        {/* مسیرنما (Breadcrumbs) */}
        <nav className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
          <span className="hover:underline cursor-pointer">خانه</span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:underline cursor-pointer">آرایشگاه مردانه</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium">آرایشگاه داریوس</span>
        </nav>

        {/* بخش عنوان و اطلاعات بالای صفحه */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">آرایشگاه داریوس</h1>
            <div className="flex flex-wrap items-center gap-2 text-[14px] text-gray-700">
              <span className="font-bold text-gray-900">۵.۰</span>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-purple-600 hover:underline cursor-pointer">(۷۷۷)</span>
              <span className="text-gray-400 mx-1">•</span>
              <span className="text-red-600 font-medium">بسته است</span>
              <span>- ساعت ۱۲:۳۰ ظهر باز می‌شود</span>
              <span className="text-gray-400 mx-1">•</span>
              <span>تهران، ولیعصر</span>
              <button className="text-purple-700 font-medium hover:underline mr-1">
                مسیریابی
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2.5 bg-white rounded-full border border-gray-200 hover:border-gray-900 transition-colors">
              <Share className="w-5 h-5 text-gray-900" />
            </button>
            <button className="p-2.5 bg-white rounded-full border border-gray-200 hover:border-gray-900 transition-colors">
              <Heart className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>

        {/* گالری تصاویر */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 h-[400px] md:h-[450px] mb-10 rounded-2xl overflow-hidden">
          <div className="md:col-span-2 relative h-full w-full bg-gray-100 group cursor-pointer overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2070&auto=format&fit=crop" 
              alt="نمای اصلی سالن"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div className="hidden md:flex flex-col gap-2 md:gap-3 h-full">
            <div className="relative flex-1 bg-gray-100 w-full overflow-hidden cursor-pointer group">
              <img 
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop" 
                alt="جزئیات سالن ۱"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="relative flex-1 bg-gray-100 w-full overflow-hidden cursor-pointer group">
              <img 
                src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2070&auto=format&fit=crop" 
                alt="جزئیات سالن ۲"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
              />
              <button className="absolute bottom-4 left-4 md:right-4 md:left-auto bg-white text-gray-900 px-4 py-2 rounded-full text-[14px] font-semibold shadow-md hover:bg-gray-50 transition-colors z-10 border border-gray-200">
                مشاهده همه تصاویر
              </button>
            </div>
          </div>
        </div>

        {/* ساختار دو ستونه */}
        <div className="flex flex-col lg:flex-row gap-8 relative items-start">
          
          {/* ستون اصلی (خدمات و تیم) */}
          <div className="flex-1 w-full lg:max-w-[calc(100%-380px)]">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">خدمات</h2>
            
            {/* تب‌های دسته‌بندی */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {['کوتاهی مو', 'اصلاح و مرتب‌سازی', 'سلامت و مراقبت', 'اشتراک'].map((tab, idx) => (
                <button 
                  key={idx}
                  className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors border ${
                    idx === 0 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* لیست سرویس‌ها */}
            <div className="space-y-4 mb-6">
              {/* سرویس ۱ */}
              <div className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[16px] font-medium text-gray-900">کوتاهی مو (Haircut)</h3>
                    <p className="text-[14px] text-gray-500 mt-1">۴۰ دقیقه</p>
                    <div className="flex items-center gap-2 mt-4 text-[14px]">
                      <span className="font-semibold text-gray-900">از ۴۰۸,۰۰۰ تومان</span>
                      <span className="text-green-600 font-medium">تا ۱۵٪ تخفیف</span>
                    </div>
                  </div>
                  <button className="px-5 py-1.5 rounded-full border border-gray-300 text-[14px] font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                    رزرو
                  </button>
                </div>
              </div>

              {/* سرویس ۲ */}
              <div className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[16px] font-medium text-gray-900">ماشین کردن مو (Buzz Cut)</h3>
                    <p className="text-[14px] text-gray-500 mt-1">۳۰ دقیقه</p>
                    <div className="flex items-center gap-2 mt-4 text-[14px]">
                      <span className="font-semibold text-gray-900">از ۳۰۶,۰۰۰ تومان</span>
                      <span className="text-green-600 font-medium">تا ۱۵٪ تخفیف</span>
                    </div>
                  </div>
                  <button className="px-5 py-1.5 rounded-full border border-gray-300 text-[14px] font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                    رزرو
                  </button>
                </div>
              </div>
            </div>

            <button className="px-6 py-2 rounded-full border border-gray-300 text-[14px] font-medium text-gray-900 hover:bg-gray-50 transition-colors mb-12">
              مشاهده همه
            </button>

            {/* بخش تیم */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">تیم</h2>
              <button className="text-[14px] font-medium text-purple-700 hover:underline">
                مشاهده همه
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 mb-20">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                    <img 
                      src={`https://i.pravatar.cc/150?img=${item * 10}`} 
                      alt={`عضو تیم ${item}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* ویجت رزرو (Sticky Sidebar) با رفتار داینامیک */}
          <div className="w-full lg:w-[350px] shrink-0 sticky top-28 transition-all duration-300">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
              
              {/* بخش بالا: همیشه دکمه رزرو را دارد، اما در حالت اسکرول شده جزئیات هم اضافه می‌شود */}
              <div className="p-6">
                
                {/* جزئیات اضافی که فقط هنگام اسکرول نمایش داده می‌شوند */}
                {isScrolled && (
                  <div className="mb-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">آرایشگاه داریوس</h2>
                    
                    {/* امتیاز */}
                    <div className="flex items-center gap-1.5 text-[15px] mb-4">
                      <span className="font-bold text-gray-900">۵.۰</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-purple-600 hover:underline cursor-pointer">(۷۷۷)</span>
                    </div>

                    {/* بج‌ها (Badges) */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[12px] font-semibold rounded-full">ویژه</span>
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-[12px] font-semibold rounded-full">تخفیف‌ها</span>
                    </div>
                  </div>
                )}

                {/* دکمه اصلی رزرو (همیشه ثابت) */}
                <button className="w-full bg-black text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-gray-800 transition-colors">
                  همین حالا رزرو کنید
                </button>
              </div>

              {/* بخش پایینی که فقط هنگام اسکرول نمایش داده می‌شود */}
              {isScrolled && (
                <div className="animate-in fade-in duration-300">
                  <div className="h-px bg-gray-100 w-full" />
                  
                  {/* اطلاعات وضعیت و آدرس */}
                  <div className="p-6 space-y-5">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex items-center gap-1 text-[14px] cursor-pointer group">
                        <span className="text-red-600 font-medium group-hover:underline">بسته است</span>
                        <span className="text-gray-700">- ساعت ۱۲:۳۰ ظهر</span>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex flex-col text-[14px]">
                        <span className="text-gray-700 leading-relaxed mb-1">
                          تهران، ولیعصر، خیابان مطهری، پلاک ۳۸
                        </span>
                        <button className="text-purple-700 font-medium hover:underline text-right w-fit">
                          مسیریابی
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 w-full" />

                  {/* بخش کارت هدیه */}
                  <div className="p-6 bg-gray-50 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-gray-900 mb-1">خرید کارت هدیه</span>
                      <span className="text-[13px] text-gray-500 line-clamp-1">برای خودتان یا دوستان.</span>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-full text-[13px] font-semibold text-gray-900 hover:border-gray-900 transition-colors shrink-0">
                      خرید
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
