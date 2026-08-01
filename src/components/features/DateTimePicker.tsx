'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

export default function DateTimePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateObject | null>(null);
  const [selectedTime, setSelectedTime] = useState('any'); // any, morning, afternoon, evening
  const popoverRef = useRef<HTMLDivElement>(null);

  // بستن پاپ‌اوور هنگام کلیک خارج از آن
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // توابع انتخاب سریع تاریخ
  const setToday = () => setSelectedDate(new DateObject({ calendar: persian, locale: persian_fa }));
  const setTomorrow = () => {
    const tomorrow = new DateObject({ calendar: persian, locale: persian_fa }).add(1, "days");
    setSelectedDate(tomorrow);
  };

  // فرمت کردن متن ورودی برای نمایش به کاربر
  const displayValue = selectedDate 
    ? `${selectedDate.format("DD MMMM YYYY")}${selectedTime !== 'any' ? ' - ' + (selectedTime === 'morning' ? 'صبح' : selectedTime === 'afternoon' ? 'عصر' : 'شب') : ''}` 
    : 'هر زمان';

  return (
    <div className="relative flex-1" ref={popoverRef}>
      {/* دکمه باز کننده (Input Trigger) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-full transition-colors h-full"
      >
        <CalendarIcon className="w-5 h-5 text-gray-400" />
        <span className={`text-sm ${selectedDate ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {displayValue}
        </span>
      </div>

      {/* پاپ‌اوور تقویم (Popover) */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-4 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 z-50 w-full min-w-[700px] flex gap-6 border border-gray-100">
          
          {/* ستون راست (در فارسی): انتخاب سریع */}
          <div className="flex flex-col gap-3 w-48 border-l border-gray-100 pl-6">
            <button 
              onClick={setToday}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200 hover:border-black transition-colors"
            >
              <span className="font-semibold text-gray-900">امروز</span>
              <span className="text-xs text-gray-500 mt-1">{new DateObject({ calendar: persian, locale: persian_fa }).format("dddd, D MMMM")}</span>
            </button>
            <button 
              onClick={setTomorrow}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-200 hover:border-black transition-colors"
            >
              <span className="font-semibold text-gray-900">فردا</span>
              <span className="text-xs text-gray-500 mt-1">{new DateObject({ calendar: persian, locale: persian_fa }).add(1, "days").format("dddd, D MMMM")}</span>
            </button>
          </div>

          {/* بخش مرکزی و چپ: تقویم و زمان */}
          <div className="flex-1 flex flex-col">
            {/* تقویم */}
            <div className="flex justify-center mb-6">
              <Calendar
                value={selectedDate}
                onChange={setSelectedDate}
                calendar={persian}
                locale={persian_fa}
                className="rmdp-mobile" // برای استایل‌های مدرن‌تر
                shadow={false}
              />
            </div>

            {/* خط جداکننده */}
            <hr className="border-gray-100 mb-6" />

            {/* فیلترهای زمانی */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900 ml-2">انتخاب زمان</span>
              
              <button 
                onClick={() => setSelectedTime('any')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedTime === 'any' ? 'border-2 border-purple-600 text-purple-700 bg-purple-50' : 'border border-gray-200 text-gray-700 hover:border-gray-300'}`}
              >
                هر زمان
              </button>
              
              <button 
                onClick={() => setSelectedTime('morning')}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-colors ${selectedTime === 'morning' ? 'border-2 border-purple-600 text-purple-700 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-sm font-medium">صبح</span>
                <span className="text-[10px] text-gray-500">۹ تا ۱۲</span>
              </button>
              
              <button 
                onClick={() => setSelectedTime('afternoon')}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-colors ${selectedTime === 'afternoon' ? 'border-2 border-purple-600 text-purple-700 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-sm font-medium">عصر</span>
                <span className="text-[10px] text-gray-500">۱۲ تا ۱۷</span>
              </button>
              
              <button 
                onClick={() => setSelectedTime('evening')}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-colors ${selectedTime === 'evening' ? 'border-2 border-purple-600 text-purple-700 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="text-sm font-medium">شب</span>
                <span className="text-[10px] text-gray-500">۱۷ تا ۲۴</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
