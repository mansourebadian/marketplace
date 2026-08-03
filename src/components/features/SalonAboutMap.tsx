// src/components/features/SalonAboutMap.tsx
import React from 'react';
import { MapPin } from 'lucide-react';

interface SalonAboutMapProps {
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
    rating: number;
  };
}

export default function SalonAboutMap({ description, location }: SalonAboutMapProps) {
  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      {/* بخش درباره ما */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">درباره ما</h2>
        <p className="text-gray-700 leading-relaxed text-justify">
          {description}
        </p>
      </section>

      {/* بخش نقشه */}
      <section>
        <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-gray-100 mb-4 border border-gray-200 shadow-inner">
          {/* در پروژه واقعی، اینجا از کامپوننت Mapbox یا Leaflet استفاده کنید */}
          <div className="absolute inset-0 bg-[url('/images/map-placeholder.jpg')] bg-cover bg-center"></div>
          
          {/* پین کاستوم نقشه (بر اساس تصویر) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold text-sm shadow-xl cursor-pointer hover:scale-105 transition-transform">
            <span>{location.rating.toFixed(1)}</span>
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        
        {/* اطلاعات آدرس زیر نقشه */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-sm text-gray-800 font-medium">{location.address}</p>
          <a 
            href={`https://maps.google.com/?q=${location.lat},${location.lng}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-indigo-600 text-sm hover:underline font-medium"
          >
            مسیریابی (Get directions)
          </a>
        </div>
      </section>
    </div>
  );
}
