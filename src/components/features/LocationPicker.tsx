'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

export default function LocationPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // بستن منوی کشویی هنگام کلیک در خارج از کامپوننت
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputClick = () => {
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

    const handleGetCurrentLocation = () => {
    setIsLoading(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          try {
            // استفاده از سرویس رایگان OpenStreetMap برای تبدیل مختصات به آدرس (Reverse Geocoding)
            // پارامتر accept-language=fa برای دریافت نام‌ها به زبان فارسی است
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=fa`
            );
            
            if (!response.ok) throw new Error("Network response was not ok");
            
            const data = await response.json();
            
            // استخراج مناسب‌ترین نام برای مکان (شهر، محله، روستا یا استان)
            if (data && data.address) {
              const { address } = data;
              const locationName = 
                address.neighbourhood || 
                address.suburb || 
                address.city_district || 
                address.city || 
                address.town || 
                address.village || 
                address.state ||
                `${lat.toFixed(4)}, ${lon.toFixed(4)}`; // فال‌بک به مختصات اگر هیچ نامی پیدا نشد
                
              setLocationText(locationName);
            } else {
              // در صورتی که دیتایی برنگشت، مختصات را نشان می‌دهیم
              setLocationText(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            }
          } catch (fetchError) {
            console.error("خطا در تبدیل مختصات به آدرس:", fetchError);
            // در صورت بروز خطای شبکه یا تحریم، مختصات خام را نمایش می‌دهیم
            setLocationText(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          } finally {
            setIsLoading(false);
            setIsOpen(false);
          }
        },
        (error) => {
          console.error("خطای Geolocation:", error);
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setLocationText('دسترسی رد شد');
              alert('لطفاً دسترسی به مکان را در مرورگر فعال کنید.');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationText('مکان در دسترس نیست');
              break;
            case error.TIMEOUT:
              setLocationText('پایان مهلت درخواست');
              break;
            default:
              setLocationText('خطای ناشناخته');
          }
          
          setIsLoading(false);
          setIsOpen(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationText('مرورگر پشتیبانی نمی‌کند');
      setIsLoading(false);
      setIsOpen(false);
    }
  };


  return (
    <div 
      ref={containerRef}
      className="relative flex items-center w-full lg:flex-1 px-4 py-3 lg:py-2 bg-white lg:bg-transparent border border-gray-200 lg:border-none lg:border-l lg:border-gray-100 rounded-xl lg:rounded-none group transition-all hover:border-gray-400 lg:hover:border-transparent cursor-text"
      onClick={handleInputClick}
    >
      <MapPin className="w-5 h-5 text-gray-500 ml-3 stroke-[1.5] shrink-0" />
      <input
        ref={inputRef}
        type="text"
        placeholder="مکان فعلی"
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
        className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-gray-900/70 text-gray-900 font-medium"
      />

      {/* Popover / Dropdown منوی موقعیت مکانی */}
      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] right-0 w-full lg:w-[350px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-2 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation(); // جلوگیری از بسته شدن فوری توسط رویداد کلیک والد
              handleGetCurrentLocation();
            }}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer text-right group/btn"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 group-hover/btn:bg-purple-100 transition-colors shrink-0">
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-purple-700 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-purple-700 stroke-[2] -rotate-45 ml-0.5" />
              )}
            </div>
            <span className="text-[15px] font-semibold text-gray-900">
              {isLoading ? 'در حال مسیریابی...' : 'مکان فعلی'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
