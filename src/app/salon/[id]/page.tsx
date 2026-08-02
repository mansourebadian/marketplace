import React from 'react';
import { Header } from '@/components/shared/Header';
import { Share, Heart, ChevronRight } from 'lucide-react';
import Image from 'next/image';

// در دنیای واقعی داده‌ها از API می‌آیند، اینجا برای نمونه از دیتای استاتیک استفاده شده است
export default function SalonDetailPage() {
  return (
    <main className="min-h-screen bg-white pb-20">
      {/* هدر با نوار جستجو فعال */}
      <Header hasSearch={true} />

      {/* فاصله دادن از هدر ثابت */}
      <div className="pt-24 md:pt-28 max-w-[1300px] mx-auto px-4">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[13px] text-gray-500 mb-6">
          <span className="hover:underline cursor-pointer">خانه</span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:underline cursor-pointer">ماساژ</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium">Ô Siam Spa Paris 5</span>
        </nav>

        {/* عنوان و اطلاعات بالایی */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
              Ô Siam Spa Paris 5
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[14px] md:text-[15px] text-gray-700">
              <span className="font-bold text-gray-900">4.9</span>
              <span className="text-yellow-400 text-lg leading-none">★★★★★</span>
              <span className="text-gray-500">(478)</span>
              <span className="text-gray-300">•</span>
              <span className="text-green-600 font-semibold">باز</span>
              <span>تا 9:00 شب</span>
              <span className="text-gray-300">•</span>
              <span>14 Rue Geoffroy-Saint-Hilaire, Paris</span>
              <button className="text-purple-700 font-semibold hover:underline ml-2">
                مسیریابی
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
              <Share className="w-5 h-5 text-gray-700" />
            </button>
            <button className="p-2.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
              <Heart className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* گالری تصاویر */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 h-[400px] md:h-[450px] mb-12 rounded-3xl overflow-hidden">
          {/* تصویر اصلی بزرگ */}
          <div className="md:col-span-2 relative h-full w-full bg-gray-100 group cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop" 
              alt="Main Spa View"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {/* تصاویر کوچک سمت چپ (در RTL) */}
          <div className="hidden md:flex flex-col gap-2 md:gap-3 h-full">
            <div className="relative flex-1 bg-gray-100 w-full overflow-hidden cursor-pointer group">
              <img 
                src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2070&auto=format&fit=crop" 
                alt="Spa Detail 1"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative flex-1 bg-gray-100 w-full overflow-hidden cursor-pointer group">
              <img 
                src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2070&auto=format&fit=crop" 
                alt="Spa Detail 2"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
              {/* دکمه مشاهده همه تصاویر */}
              <button className="absolute bottom-4 left-4 bg-white/95 text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:bg-white transition-colors z-10">
                مشاهده همه تصاویر
              </button>
            </div>
          </div>
        </div>

        {/* بخش محتوای اصلی و ستون رزرو */}
        <div className="flex flex-col lg:flex-row gap-10 relative">
          
          {/* ستون راست (لیست خدمات) */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">خدمات</h2>
            
            {/* Tabs خدمات */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {['همه', 'ماساژ کلاسیک', 'مدلینگ', 'تشریفات ویژه'].map((tab, idx) => (
                <button 
                  key={idx}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${idx === 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* لیست آیتم‌های خدماتی - برای نمونه */}
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex justify-between items-center py-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">ماساژ تایلندی سنتی</h3>
                    <p className="text-sm text-gray-500 mt-1">۱ ساعت • ویژه بانوان و آقایان</p>
                    <p className="text-[15px] font-semibold text-gray-900 mt-2">$$ 850,000 تومان</p>
                  </div>
                  <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-black transition-colors">
                    <span className="text-xl leading-none font-light">+</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ستون چپ (کارت چسبان رزرو - Sticky Widget) */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-28 bg-white border border-gray-200 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
              <button className="w-full bg-black text-white rounded-2xl py-4 text-[16px] font-semibold hover:bg-gray-800 transition-colors">
                همین حالا رزرو کنید
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                پرداخت در محل یا آنلاین
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
