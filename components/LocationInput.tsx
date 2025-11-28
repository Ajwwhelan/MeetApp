import React from 'react';
import { StartIcon, DestinationIcon, MyLocationIcon, LoadingIcon } from './icons';

interface LocationInputProps {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  iconType: 'start' | 'destination';
  onGeolocate?: () => void;
  isGeolocating?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({ id, value, onChange, placeholder, iconType, onGeolocate, isGeolocating }) => {
  return (
    <div className="relative flex items-center group">
      <div className="absolute left-5 text-gray-500 transition-colors group-focus-within:text-blue-600">
        {iconType === 'start' ? <StartIcon className="w-6 h-6" /> : <DestinationIcon className="w-6 h-6" />}
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-base font-semibold pl-14 pr-14 h-16 bg-[#F8FAFC] text-gray-900 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 focus:bg-white placeholder:text-gray-400 transition-all shadow-sm hover:shadow-md hover:bg-white"
      />
       {onGeolocate && (
          <button onClick={onGeolocate} disabled={isGeolocating} className="absolute right-4 text-blue-600 hover:text-blue-800 disabled:text-gray-300 disabled:cursor-wait p-2 rounded-full hover:bg-blue-50 transition-colors" aria-label="Use my current location">
              {isGeolocating ? <LoadingIcon /> : <MyLocationIcon className="w-6 h-6" />}
          </button>
        )}
    </div>
  );
};

export default LocationInput;