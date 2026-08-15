"use client";

import React, { useState, useEffect } from 'react';
import { Star, Clock, ChevronDown, MapPin } from 'lucide-react';

// ایجاد یک اینترفیس برای تایپ‌دهی دقیق و رهایی از any
interface Review {
  rating: number;
}

interface SalonType {
  name: string;
  address: string;
  reviews?: Review[];
}

interface SalonSidebarProps {
  salon: SalonType; 
}

export default function SalonSidebar({ salon }: SalonSidebarProps) {
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

  // استفاده از تایپ Review برای curr
  const averageRating = salon.reviews?.length 
    ? (salon.reviews.reduce((acc: number, curr: Review) => acc + curr.rating, 0) / salon.reviews.length).toFixed(1)
    : '۵.۰';

  return (
    <div className="w-full lg:w-[350px] shrink-0 sticky top-28 h-fit self-start transition-all duration-300 z-10 pb-10">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300">
        
        <div className="p-6">
          {isScrolled && (
            <div className="mb-5 animate-in fade-in slide-in-from-top-4 duration-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{salon.name}</h2>
              
              <div className="flex items-center gap-1.5 text-[15px] mb-4">
                <span className="font-bold text-gray-900">{averageRating}</span>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-purple-600 hover:underline cursor-pointer">({salon.reviews?.length || 0})</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[12px] font-semibold rounded-full">ویژه (Featured)</span>
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
                  <span className="text-gray-700">- بررسی ساعات کاری</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors mr-1" />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-800 shrink-0 mt-0.5" />
                <div className="flex flex-col text-[14px]">
                  <span className="text-gray-700 leading-relaxed mb-1 text-right">
                    {salon.address}
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
  );
}
