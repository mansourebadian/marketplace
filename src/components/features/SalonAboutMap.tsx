// src/components/features/SalonAboutMap.tsx
import React from 'react';
import SalonLocationMap from './SalonLocationMap';

interface SalonAboutMapProps {
  description: string;
  location: {
    address: string;
    lat: number;
    lng: number;
    rating: number | null;
  };
}

export default function SalonAboutMap({ description, location }: SalonAboutMapProps) {
  return (
    <div className="mt-16 border-t border-gray-100 pt-12">
      {/* بخش درباره ما */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">درباره ما</h2>
        <p className="text-gray-700 leading-relaxed text-justify whitespace-pre-line">
          {description}
        </p>
      </section>

      {/* بخش نقشه */}
      <section>
        <SalonLocationMap lat={location.lat} lng={location.lng} />
        
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
