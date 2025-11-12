
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
      <div className="absolute left-3 text-gray-500">
        {iconType === 'start' ? <StartIcon /> : <DestinationIcon />}
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-100 text-gray-900 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 transition-colors"
      />
       {onGeolocate && (
          <button onClick={onGeolocate} disabled={isGeolocating} className="absolute right-3 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-wait" aria-label="Use my current location">
              {isGeolocating ? <LoadingIcon /> : <MyLocationIcon />}
          </button>
        )}
    </div>
  );
};

export default LocationInput;