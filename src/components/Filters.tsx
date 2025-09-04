'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FunnelIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface FilterOptions {
  location: string[];
  industry: string[];
  type: string[];
  duration: string[];
  stipendRange: [number, number];
  skills: string[];
  remote: boolean | null;
}

interface FiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isMobile?: boolean;
}

const industries = [
  'Technology',
  'Finance',
  'Marketing',
  'Consulting',
  'Healthcare',
  'Education',
  'E-commerce',
  'Manufacturing',
  'Media & Entertainment',
  'Non-profit',
  'Real Estate',
  'Transportation',
  'Energy',
  'Legal',
  'Government'
];

const locations = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Pimpri-Chinchwad',
  'Patna',
  'Vadodara'
];

const durations = [
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '1+ years'
];

const types = [
  'Remote',
  'On-site',
  'Hybrid'
];

export default function Filters({ filters, onFiltersChange, isMobile = false }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleFilterChange = (key: keyof FilterOptions, value: unknown) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = localFilters.location.includes(location)
      ? localFilters.location.filter(l => l !== location)
      : [...localFilters.location, location];
    handleFilterChange('location', newLocations);
  };

  const handleIndustryToggle = (industry: string) => {
    const newIndustries = localFilters.industry.includes(industry)
      ? localFilters.industry.filter(i => i !== industry)
      : [...localFilters.industry, industry];
    handleFilterChange('industry', newIndustries);
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = localFilters.type.includes(type)
      ? localFilters.type.filter(t => t !== type)
      : [...localFilters.type, type];
    handleFilterChange('type', newTypes);
  };

  const handleDurationToggle = (duration: string) => {
    const newDurations = localFilters.duration.includes(duration)
      ? localFilters.duration.filter(d => d !== duration)
      : [...localFilters.duration, duration];
    handleFilterChange('duration', newDurations);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      location: [],
      industry: [],
      type: [],
      duration: [],
      stipendRange: [0, 100000],
      skills: [],
      remote: null
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = 
    localFilters.location.length +
    localFilters.industry.length +
    localFilters.type.length +
    localFilters.duration.length +
    (localFilters.remote !== null ? 1 : 0) +
    (localFilters.stipendRange[1] !== 100000 ? 1 : 0);

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {children}
    </div>
  );

  const FilterChip = ({ 
    label, 
    isActive, 
    onClick 
  }: { 
    label: string; 
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  const filterContent = (
    <div className="space-y-6">
      {/* Location */}
      <FilterSection title="Location">
        <div className="grid grid-cols-2 gap-2">
          {locations.map((location) => (
            <FilterChip
              key={location}
              label={location}
              isActive={localFilters.location.includes(location)}
              onClick={() => handleLocationToggle(location)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Industry */}
      <FilterSection title="Industry">
        <div className="grid grid-cols-2 gap-2">
          {industries.map((industry) => (
            <FilterChip
              key={industry}
              label={industry}
              isActive={localFilters.industry.includes(industry)}
              onClick={() => handleIndustryToggle(industry)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Work Type */}
      <FilterSection title="Work Type">
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <FilterChip
              key={type}
              label={type}
              isActive={localFilters.type.includes(type)}
              onClick={() => handleTypeToggle(type)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Duration */}
      <FilterSection title="Duration">
        <div className="flex flex-wrap gap-2">
          {durations.map((duration) => (
            <FilterChip
              key={duration}
              label={duration}
              isActive={localFilters.duration.includes(duration)}
              onClick={() => handleDurationToggle(duration)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Stipend Range */}
      <FilterSection title="Stipend Range">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>₹{localFilters.stipendRange[0].toLocaleString()}</span>
            <span>₹{localFilters.stipendRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            step="5000"
            value={localFilters.stipendRange[1]}
            onChange={(e) => handleFilterChange('stipendRange', [0, parseInt(e.target.value)])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </FilterSection>

      {/* Remote Only */}
      <FilterSection title="Remote Work">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="remote"
              checked={localFilters.remote === true}
              onChange={() => handleFilterChange('remote', true)}
              className="mr-2"
            />
            <span className="text-sm">Remote Only</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="remote"
              checked={localFilters.remote === false}
              onChange={() => handleFilterChange('remote', false)}
              className="mr-2"
            />
            <span className="text-sm">On-site Only</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="remote"
              checked={localFilters.remote === null}
              onChange={() => handleFilterChange('remote', null)}
              className="mr-2"
            />
            <span className="text-sm">All</span>
          </label>
        </div>
      </FilterSection>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Filter Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Mobile Filter Modal */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-white dark:bg-gray-900 w-full max-h-[80vh] rounded-t-xl p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filters</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                {filterContent}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Clear All
          </button>
        )}
      </div>
      {filterContent}
    </div>
  );
}
