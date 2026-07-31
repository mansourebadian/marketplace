// src/components/features/Hero.tsx
import React from 'react';
import { Search, MapPin, Calendar, QrCode } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative pt-24 md:pt-44 pb-24 px-4 flex flex-col items-center justify-center min-h-[75vh] overflow-hidden">
      
      {/* Background Gradients (Mirrored for RTL visual balance) */}
      <div className="absolute inset-0 -z-10 bg-[#faf8ff] md:bg-[#faf8ff] overflow-hidden bg-gradient-to-b from-white via-white to-[#faf8ff]">
        <div className="absolute top-[40%] md:top-[-5%] right-[-10%] md:right-[-5%] w-[80%] md:w-[60%] h-[60%] rounded-full bg-purple-200/70 blur-[100px] md:blur-[130px]" />
        <div className="absolute top-[50%] md:top-[15%] left-[-10%] md:left-[-5%] w-[70%] md:w-[50%] h-[50%] rounded-full bg-pink-200/60 blur-[90px] md:blur-[110px]" />
        <div className="absolute bottom-[-10%] right-[10%] md:right-[20%] w-[80%] md:w-[60%] h-[50%] rounded-full bg-blue-100/60 blur-[100px] md:blur-[120px]" />
      </div>

      {/* Headings */}
      <div className="w-full text-right md:text-center mb-8 md:mb-10 space-y-3 max-w-[850px] z-10 px-0 md:px-4 mt-8 md:mt-0">
        <h1 className="text-[32px] md:text-[44px] lg:text-[56px] leading-[1.1] font-extrabold text-gray-900 tracking-tight">
          رزرو خدمات مراقبت شخصی محلی
        </h1>
        <p className="text-[15px] md:text-[17px] text-gray-700 font-medium max-w-[700px] md:mx-auto mt-4 pl-4 md:pl-0">
          بهترین سالن‌ها، آرایشگاه‌ها، مراکز درمانی، استودیوهای سلامتی و متخصصان زیبایی که مورد اعتماد میلیون‌ها نفر در سراسر جهان هستند را کشف کنید
        </p>
      </div>

      {/* Search Bar Container */}
      <div className="w-full max-w-[950px] mx-auto bg-white/90 md:bg-white/60 lg:bg-white backdrop-blur-md lg:backdrop-blur-none rounded-3xl lg:rounded-full shadow-[0_12px_40px_rgb(0,0,0,0.08)] lg:shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 md:p-5 lg:p-2.5 flex flex-col lg:flex-row items-center gap-3 lg:gap-0 z-10 border border-white/40 lg:border-none">
        
        {/* Treatment Input */}
        <div className="flex items-center w-full lg:flex-1 px-4 py-3 lg:py-2 bg-white lg:bg-transparent border border-gray-200 lg:border-none lg:border-l lg:border-gray-100 rounded-xl lg:rounded-none group cursor-text transition-all hover:border-gray-400 lg:hover:border-transparent">
          <Search className="w-5 h-5 text-gray-500 ml-3 stroke-[1.5]" />
          <input 
            type="text" 
            placeholder="همه خدمات" 
            className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-gray-900/70 text-gray-900 font-medium"
          />
        </div>

        {/* Location Input */}
        <div className="flex items-center w-full lg:flex-1 px-4 py-3 lg:py-2 bg-white lg:bg-transparent border border-gray-200 lg:border-none lg:border-l lg:border-gray-100 rounded-xl lg:rounded-none group cursor-text transition-all hover:border-gray-400 lg:hover:border-transparent">
          <MapPin className="w-5 h-5 text-gray-500 ml-3 stroke-[1.5]" />
          <input 
            type="text" 
            placeholder="مکان فعلی" 
            className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-gray-900/70 text-gray-900 font-medium"
          />
        </div>

        {/* Time/Date Input */}
        <div className="flex items-center w-full lg:flex-[0.8] px-4 py-3 lg:py-2 bg-white lg:bg-transparent border border-gray-200 lg:border-none rounded-xl lg:rounded-none group cursor-text transition-all hover:border-gray-400 lg:hover:border-transparent">
          <Calendar className="w-5 h-5 text-gray-500 ml-3 stroke-[1.5]" />
          <input 
            type="text" 
            placeholder="هر زمان" 
            className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-gray-900/70 text-gray-900 font-medium"
          />
        </div>

        {/* Search Button */}
        <button className="w-full lg:w-auto bg-black hover:bg-gray-800 text-white text-[15px] font-semibold rounded-2xl lg:rounded-full px-8 py-3.5 lg:py-3.5 transition-colors whitespace-nowrap mt-1 lg:mt-0 shadow-md lg:shadow-none">
          <span className="lg:hidden">جستجوی فریشا</span>
          <span className="hidden lg:inline">جستجو</span>
        </button>
      </div>

      {/* Stats and App Button */}
      <div className="mt-10 md:mt-12 flex flex-col items-center gap-6 z-10">
        <p className="text-[14px] md:text-[15px] lg:text-[17px] text-gray-900">
          <span className="font-semibold border-b-[2px] border-dotted border-gray-400 pb-0.5 ml-1.5 cursor-pointer hover:border-gray-800 transition-colors">
            325,317
          </span>
          نوبت رزرو شده در امروز
        </p>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md transition-all text-[14px] font-semibold text-gray-900">
          دریافت اپلیکیشن
          <QrCode className="w-4 h-4" />
        </button>
      </div>

    </section>
  );
};
