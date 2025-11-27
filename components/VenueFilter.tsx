
import React from 'react';
import { FilterIcon } from './icons';

interface VenueFilterProps {
  types: string[];
  selectedType: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const VenueFilter: React.FC<VenueFilterProps> = ({ types, selectedType, onChange }) => {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-4 text-gray-500 pointer-events-none">
        <FilterIcon />
      </div>
      <select
        value={selectedType}
        onChange={onChange}
        className="appearance-none w-full md:w-56 text-sm pl-12 pr-10 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow cursor-pointer hover:bg-gray-50"
        aria-label="Filter venues by type"
      >
        {types.map(type => (
          <option key={type} value={type}>
            {type === 'All' ? 'All Types' : type}
          </option>
        ))}
      </select>
       <div className="absolute right-3 text-gray-500 pointer-events-none">
        <span className="material-symbols-outlined text-sm">expand_more</span>
      </div>
    </div>
  );
};

export default VenueFilter;
