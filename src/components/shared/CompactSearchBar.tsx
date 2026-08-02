'use client';

import React from 'react';
import { Search } from 'lucide-react';
import LocationPicker from '../features/LocationPicker';
import DateTimePicker from '../features/DateTimePicker';

export const CompactSearchBar = () => {
  return (
    <div className="hidden lg:flex items-center flex-1 max-w-[700px] mx-8 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow h-12">
      
      {/* Search Service */}
      <div className="flex items-center flex-1 h-full px-4 border-l border-gray-200 hover:bg-gray-50 rounded-r-full cursor-text transition-colors">
        <Search className="w-4 h-4 text-gray-500 ml-2" />
        <input
          type="text"
          placeholder="همه خدمات"
          className="w-full bg-transparent border-none outline-none text-[14px] text-gray-900 placeholder:text-gray-500"
        />
      </div>

      {/* Location */}
      <div className="flex items-center flex-1 h-full border-l border-gray-200 hover:bg-gray-50 transition-colors">
        {/* برای سازگاری با اندازه کوچک‌تر، می‌توانید پراپ سایز به LocationPicker بدهید */}
        <LocationPicker /> 
      </div>

      {/* Date & Time */}
      <div className="flex items-center flex-[1.2] h-full hover:bg-gray-50 rounded-l-full transition-colors relative pr-2">
        <DateTimePicker />
        <button className="absolute left-2 bg-black hover:bg-gray-800 text-white p-2 rounded-full transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
