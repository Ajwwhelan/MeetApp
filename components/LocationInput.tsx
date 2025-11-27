
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
    <div className="relative flex items-center">
      <div className="absolute left-4 text-gray-500">
        {iconType === 'start' ? <StartIcon /> : <DestinationIcon />}
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-base pl-12 pr-12 h-14 bg-[#F0F4F8] text-gray-900 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder:text-gray-500 transition-all shadow-inner md:shadow-none"
      />
       {onGeolocate && (
          <button onClick={onGeolocate} disabled={isGeolocating} className="absolute right-4 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-wait p-1 rounded-full hover:bg-blue-50" aria-label="Use my current location">
              {isGeolocating ? <LoadingIcon /> : <MyLocationIcon />}
          </button>
        )}
    </div>
  );
};

export default LocationInput;
