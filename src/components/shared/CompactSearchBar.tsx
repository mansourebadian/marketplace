'use client';

import React from 'react';
import { Search } from 'lucide-react';
import LocationPicker from '../features/LocationPicker';
import DateTimePicker from '../features/DateTimePicker';
import TreatmentsDropdown from './TreatmentsDropdown';

export const CompactSearchBar = () => {
  return (
    <form action="/search" className="hidden lg:flex items-center flex-1 max-w-[700px] mx-8 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow h-12">
      
      <TreatmentsDropdown variant="compact" placeholder="همه خدمات" />

      {/* Location */}
      <div className="flex items-center flex-1 h-full border-l border-gray-200 hover:bg-gray-50 transition-colors">
        {/* برای سازگاری با اندازه کوچک‌تر، می‌توانید پراپ سایز به LocationPicker بدهید */}
        <LocationPicker /> 
      </div>

      {/* Date & Time */}
      <div className="flex items-center flex-[1.2] h-full hover:bg-gray-50 rounded-l-full transition-colors relative pr-2">
        <DateTimePicker />
        <button aria-label="?????" className="absolute left-2 bg-black hover:bg-gray-800 text-white p-2 rounded-full transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>

    </form>
  );
};
