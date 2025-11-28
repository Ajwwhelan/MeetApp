import React from 'react';
import { FilterIcon } from './icons';

interface VenueFilterProps {
  types: string[];
  selectedType: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const VenueFilter: React.FC<VenueFilterProps> = ({ types, selectedType, onChange }) => {
  return (
    <div className="relative flex items-center group">
      <div className="absolute left-4 text-gray-500 pointer-events-none group-hover:text-blue-600 transition-colors">
        <FilterIcon />
      </div>
      <select
        value={selectedType}
        onChange={onChange}
        className="appearance-none w-full md:w-60 text-sm font-bold pl-11 pr-10 py-3 bg-white text-gray-800 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer hover:bg-gray-50 hover:border-gray-300 shadow-sm"
        aria-label="Filter venues by type"
      >
        {types.map(type => (
          <option key={type} value={type} className="font-medium">
            {type === 'All' ? 'All Types' : type}
          </option>
        ))}
      </select>
       <div className="absolute right-4 text-gray-400 pointer-events-none">
        <span className="material-symbols-rounded text-base font-bold">expand_more</span>
      </div>
    </div>
  );
};

export default VenueFilter;