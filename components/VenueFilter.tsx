
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
      <div className="absolute left-3 text-gray-500 pointer-events-none">
        <FilterIcon />
      </div>
      <select
        value={selectedType}
        onChange={onChange}
        className="appearance-none w-full md:w-48 pl-10 pr-8 py-2.5 bg-white text-gray-900 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
        aria-label="Filter venues by type"
      >
        {types.map(type => (
          <option key={type} value={type}>
            {type === 'All' ? 'All Types' : type}
          </option>
        ))}
      </select>
       <div className="absolute right-3 text-gray-500 pointer-events-none">
        <span className="material-symbols-outlined">expand_more</span>
      </div>
    </div>
  );
};

export default VenueFilter;
