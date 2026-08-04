"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { 
  Share, Heart, ChevronRight, Star, Clock, MapPin, ChevronDown,
  BadgeCheck, Check, CreditCard, Smile, Accessibility, Car 
} from 'lucide-react';
import SalonAboutMap from '@/components/features/SalonAboutMap';

// --- Mock Data ---
 const salonData = {
    description: 'از لحظه‌ای که قدم به داخل می‌گذارید، فضای آرام و اشتیاق به این حرفه را احساس می‌کنید. این مکان مهارت را با رویکردی شخصی ترکیب می‌کند، بنابراین شما نه تنها با یک کوتاهی موی عالی، بلکه با احساسی فوق‌العاده اینجا را ترک می‌کنید. هر بازدید بر محور استایل، راحتی و توجه به جزئیات است.',
    location: {
      address: 'Kruisweg 38, Oude Stad, Haarlem, Noord-holland',
      lat: 52.387387,
      lng: 4.646219,
      rating: 5.0
    }
  };

// داده‌های تستی ساعات کاری
const openingTimes = [
  { id: 1, day: 'دوشنبه (Monday)', time: '10:00 AM - 7:00 PM', isOpen: true, isToday: false },
  { id: 2, day: 'سه‌شنبه (Tuesday)', time: '10:00 AM - 7:00 PM', isOpen: true, isToday: true }, // روز جاری
  { id: 3, day: 'چهارشنبه (Wednesday)', time: '10:00 AM - 7:00 PM', isOpen: true, isToday: false },
  { id: 4, day: 'پنجشنبه (Thursday)', time: '10:00 AM - 7:00 PM', isOpen: true, isToday: false },
  { id: 5, day: 'جمعه (Friday)', time: '10:00 AM - 7:00 PM', isOpen: true, isToday: false },
  { id: 6, day: 'شنبه (Saturday)', time: '10:00 AM - 7:00 PM', isOpen: true, isToday: false },
  { id: 7, day: 'یکشنبه (Sunday)', time: 'بسته (Closed)', isOpen: false, isToday: false },
];

// داده‌های تستی اعضای تیم
const teamMembers = [
  { id: 1, name: 'جرارد', role: 'آرایشگر ارشد', rating: '۵.۰', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 2, name: 'ملیح', role: 'آرایشگر', rating: '۴.۹', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 3, name: 'رایوانو', role: 'آرایشگر ارشد', rating: '۵.۰', avatar: 'https://i.pravatar.cc/150?img=13' },
  { id: 4, name: 'مرل', role: 'آرایشگر ارشد', rating: '۵.۰', avatar: 'https://i.pravatar.cc/150?img=14' },
  { id: 5, name: 'شلدون', role: 'آرایشگر ارشد', rating: '۵.۰', avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: 6, name: 'نادیا', role: 'آرایشگر ارشد', rating: '۵.۰', avatar: 'https://i.pravatar.cc/150?img=16' },
  { id: 7, name: 'داریو', role: 'مدیر سالن', rating: '۵.۰', avatar: 'https://i.pravatar.cc/150?img=17' },
];

// داده‌های تستی نظرات
const reviewsData = [
  { 
    id: 1, initial: 'D', name: 'Daniel U', date: 'پنجشنبه، ۹ مرداد ۱۴۰۵ ساعت ۱۰:۳۷', rating: 5, 
    comment: 'عالی بود! (Perfect!)', 
    avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' 
  },
  { 
    id: 2, initial: 'M', name: 'Misha K', date: 'چهارشنبه، ۱ مرداد ۱۴۰۵ ساعت ۱۷:۳۷', rating: 5, 
    comment: 'فوق‌العاده! (Top!)', 
    avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' 
  },
  { 
    id: 3, initial: 'A', name: 'کاربر ناشناس (Anonymous)', date: 'چهارشنبه، ۲۵ تیر ۱۴۰۵ ساعت ۱۱:۳۰', rating: 5, 
    comment: 'مرل موهای من رو با دقت و عالی کوتاه کرد! به شدت پیشنهاد می‌کنم برای وقت گرفتن باهاش اقدام کنید. من همیشه به این سالن میام...', 
    readMore: true, avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' 
  },
  { 
    id: 4, initial: 'V', name: 'Victor A', date: 'سه‌شنبه، ۲۴ تیر ۱۴۰۵ ساعت ۱۸:۴۵', rating: 5, 
    comment: 'مرل بهترینه 🤌', 
    avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' 
  },
  { 
    id: 5, initial: 'Z', name: 'Zeny S', date: 'دوشنبه، ۲۳ تیر ۱۴۰۵ ساعت ۱۴:۴۸', rating: 5, 
    comment: 'باز هم یک جلسه عالی، واقعا تجربه خوبی بود (Weer een top sessie...)', 
    avatarBg: 'bg-[#004d40]', avatarText: 'text-white' 
  },
  { 
    id: 6, initial: 'A', name: 'Alexander S', date: 'شنبه، ۲۱ تیر ۱۴۰۵ ساعت ۱۰:۴۴', rating: 5, 
    comment: 'بی‌نظیر (Topper)', 
    avatarBg: 'bg-purple-100', avatarText: 'text-purple-700' 
  },
];

// داده‌های تستی نمونه‌کارها (Portfolio)
const portfolioItems = [
  { id: 1, src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=600&auto=format&fit=crop', isTall: true },
  { id: 2, src: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=400&auto=format&fit=crop' },
  { id: 3, src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=400&auto=format&fit=crop' },
  { id: 4, src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' },
  { id: 5, src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
  { id: 6, src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop' },
  { id: 7, src: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop' },
  { id: 8, src: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=400&auto=format&fit=crop' },
  { id: 9, src: 'https://images.unsplash.com/photo-1517832606709-0b5abf0e4b85?q=80&w=400&auto=format&fit=crop', remainingCount: 18 },
];

export default function SalonDetailPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
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
          <span className="text-gray-900 font-medium">آرایشگاه داریوس (DARIOS Barbers)</span>
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
              <Share className="w-5 h-5 text-gray-700" />
            </button>
            <button className="p-2.5 bg-white rounded-full border border-gray-200 hover:border-gray-900 transition-colors">
              <Heart className="w-5 h-5 text-gray-700" />
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

        {/* ساختار دو ستونه اصلی */}
        <div className="flex flex-col lg:flex-row gap-12 relative items-start">
          
          {/* ستون اصلی (محتوای صفحه) */}
          <div className="flex-1 w-full lg:max-w-[calc(100%-380px)]">
            
            {/* ----------------- بخش خدمات ----------------- */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">خدمات</h2>
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

            <div className="space-y-4 mb-6">
              {/* سرویس ۱ */}
              <div className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-[16px] font-medium text-gray-900">کوتاهی مو (Buzz Cut)</h3>
                    <p className="text-[14px] text-gray-500 mt-1">۳۰ دقیقه</p>
                    <div className="flex items-center gap-2 mt-3 text-[14px]">
                      <span className="font-semibold text-gray-900">از ۳۰۶,۰۰۰ تومان</span>
                      <span className="text-green-600 font-medium">تا ۱۵٪ تخفیف</span>
                    </div>
                  </div>
                  <button className="px-6 py-2 rounded-full border border-gray-300 text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    رزرو
                  </button>
                </div>
              </div>
              {/* سرویس ۲ */}
              <div className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-[16px] font-medium text-gray-900">اصلاح کانتور (Contouren)</h3>
                    <p className="text-[14px] text-gray-500 mt-1">۲۰ دقیقه</p>
                    <div className="flex items-center gap-2 mt-3 text-[14px]">
                      <span className="font-semibold text-gray-900">از ۲۰۴,۰۰۰ تومان</span>
                      <span className="text-green-600 font-medium">تا ۱۵٪ تخفیف</span>
                    </div>
                  </div>
                  <button className="px-6 py-2 rounded-full border border-gray-300 text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    رزرو
                  </button>
                </div>
              </div>
            </div>

            <button className="px-6 py-2 rounded-full border border-gray-300 text-[14px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors mb-12">
              مشاهده همه
            </button>

            {/* ----------------- بخش تیم ----------------- */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">تیم (Team)</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4 mb-16">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex flex-col items-center group cursor-pointer">
                  <div className="relative mb-3">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gray-200 transition-colors">
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2.5 py-0.5 rounded-full border border-gray-200 shadow-sm flex items-center justify-center gap-1 min-w-[50px] z-10">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[13px] font-bold text-gray-900 pt-0.5">{member.rating}</span>
                    </div>
                  </div>
                  <h4 className="text-[15px] font-semibold text-gray-900 mt-2">{member.name}</h4>
                  <p className="text-[13px] text-gray-500 mt-0.5">{member.role}</p>
                </div>
              ))}
            </div>

            <hr className="border-gray-100 mb-12" />

            {/* ----------------- بخش نظرات (Reviews) ----------------- */}
            <div className="mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">نظرات (Reviews)</h2>
              
              {/* خلاصه امتیازات */}
              <div className="flex flex-col mb-10">
                <div className="flex items-center gap-1 text-yellow-400 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-current" />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[15px]">
                  <span className="font-bold text-lg text-gray-900">۵.۰</span>
                  <span className="text-purple-600 hover:underline cursor-pointer">(۷۷۷)</span>
                </div>
              </div>

              {/* گرید نظرات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 mb-8">
                {reviewsData.map((review) => (
                  <div key={review.id} className="flex flex-col text-right">
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${review.avatarBg} ${review.avatarText}`}>
                        {review.initial}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-semibold text-gray-900">{review.name}</span>
                        <span className="text-[13px] text-gray-500 mt-0.5">{review.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-yellow-400 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>

                    <p className="text-[15px] text-gray-800 leading-relaxed">
                      {review.comment}
                    </p>
                    {review.readMore && (
                      <button className="text-purple-700 text-[14px] font-medium hover:underline text-right mt-1 w-fit">
                        مشاهده بیشتر (Read more)
                      </button>
                    )}

                  </div>
                ))}
              </div>

              <button className="px-6 py-3 rounded-full border border-gray-300 text-[15px] font-semibold text-gray-900 hover:bg-gray-50 transition-colors mt-4">
                مشاهده همه ۷۷۷ نظر
              </button>
            </div>

            <hr className="border-gray-100 mb-12" />

            {/* ----------------- بخش نمونه‌کارها (Portfolio) ----------------- */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">نمونه‌کارها (Portfolio)</h2>
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-full border border-gray-200/60">
                  ۲۷
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[160px] md:auto-rows-[170px] gap-3">
                {portfolioItems.map((item) => {
                  return (
                    <div 
                      key={item.id} 
                      className={`relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer group select-none ${
                        item.isTall 
                          ? 'col-span-2 row-span-2' 
                          : 'col-span-1 row-span-1'
                      }`}
                    >
                      <img 
                        src={item.src} 
                        alt={`Portfolio item ${item.id}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />

                      {item.remainingCount && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center transition-colors group-hover:bg-black/60">
                          <span className="text-white font-extrabold text-2xl md:text-3xl tracking-wider" dir="ltr">
                            +{item.remainingCount}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ----------------- نقشه و اطلاعات سالن ----------------- */}
            <SalonAboutMap 
              description={salonData.description} 
              location={salonData.location} 
            />

            {/* ----------------- بخش جدید: ساعات کاری و اطلاعات تکمیلی ----------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10 mb-16">
              
              {/* ستون اول: ساعات کاری (Opening times) */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">ساعات کاری (Opening times)</h3>
                <ul className="space-y-4">
                  {openingTimes.map((item) => (
                    <li 
                      key={item.id} 
                      className={`flex justify-between items-center text-[15px] ${item.isToday ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.isOpen ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span>{item.day}</span>
                      </div>
                      <span className={!item.isOpen ? 'text-gray-500' : ''}>{item.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ستون دوم: اطلاعات تکمیلی (Additional information) */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">اطلاعات تکمیلی (Additional info)</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-[15px] text-gray-900">
                    <BadgeCheck className="w-5 h-5 text-purple-600 shrink-0" />
                    <span>کسب‌وکار تایید شده توسط Fresha</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-gray-900">
                    <Check className="w-5 h-5 text-gray-500 shrink-0" />
                    <span>تایید فوری (Instant confirmation)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-gray-900">
                    <CreditCard className="w-5 h-5 text-gray-500 shrink-0" />
                    <span>پرداخت از طریق اپلیکیشن</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-gray-900">
                    <Smile className="w-5 h-5 text-gray-500 shrink-0" />
                    <span>مناسب برای کودکان (Kid-friendly)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-gray-900">
                    <Accessibility className="w-5 h-5 text-gray-500 shrink-0" />
                    <span>دسترسی برای صندلی چرخدار</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-gray-900">
                    <Car className="w-5 h-5 text-gray-500 shrink-0" />
                    <span>دارای پارکینگ (Parking available)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-gray-900 pl-8 md:pl-0 pr-8">
                    <span>دوستدار محیط زیست (Environmentally friendly)</span>
                  </li>
                  <li className="flex items-center gap-3 text-[15px] text-gray-900 pl-8 md:pl-0 pr-8">
                    <span>مدیریت توسط بانوان (Woman-owned)</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          {/* ----------------- ویجت رزرو (Sticky Sidebar) ----------------- */}
          <div className="w-full lg:w-[350px] shrink-0 sticky top-28 h-fit self-start transition-all duration-300 z-10 pb-10">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300">
              
              <div className="p-6">
                {isScrolled && (
                  <div className="mb-5 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">آرایشگاه مردانه داریوس</h2>
                    
                    <div className="flex items-center gap-1.5 text-[15px] mb-4">
                      <span className="font-bold text-gray-900">۵.۰</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-purple-600 hover:underline cursor-pointer">(۷۷۷)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[12px] font-semibold rounded-full">ویژه (Featured)</span>
                      <span className="px-3 py-1 bg-green-50 text-green-700 text-[12px] font-semibold rounded-full">تخفیف‌دار</span>
                    </div>
                  </div>
                )}

                <button className="w-full bg-black text-white rounded-xl py-3.5 text-[15px] font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                  رزرو نوبت
                </button>
              </div>

              {isScrolled && (
                <div className="animate-in fade-in duration-300">
                  <div className="h-px bg-gray-100 w-full" />
                  
                  <div className="p-6 space-y-5">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-800 shrink-0 mt-0.5" />
                      <div className="flex items-center gap-1 text-[14px] cursor-pointer group">
                        <span className="text-red-600 font-medium group-hover:underline">بسته است</span>
                        <span className="text-gray-700">- ساعت ۱۲:۳۰ ظهر باز می‌شود</span>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors mr-1" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-800 shrink-0 mt-0.5" />
                      <div className="flex flex-col text-[14px]">
                        <span className="text-gray-700 leading-relaxed mb-1 text-right">
                          تهران، خیابان ولیعصر، بالاتر از میدان ونک، کوچه نگار، پلاک ۳۸
                        </span>
                        <button className="text-purple-700 font-medium hover:underline w-fit text-right">
                          مسیریابی
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 w-full" />

                  <div className="p-6 bg-white flex items-center justify-between gap-4">
                    <div className="flex flex-col text-right w-full">
                      <span className="text-[14px] font-semibold text-gray-900 mb-1">خرید کارت هدیه</span>
                      <span className="text-[13px] text-gray-500">خود یا دوستانتان را برای مراجعات بعدی مهمان کنید.</span>
                    </div>
                    <button className="px-5 py-2 bg-white border border-gray-200 rounded-full text-[13px] font-semibold text-gray-900 hover:border-gray-900 transition-colors shrink-0">
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
