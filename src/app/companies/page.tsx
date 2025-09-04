'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  StarIcon,
  HeartIcon,
  UsersIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  internshipCount: number;
  isFavorite: boolean;
}

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [restrictToAdmin, setRestrictToAdmin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Consulting', 'Media', 'Non-profit'];
  const locations = ['New York, NY', 'San Francisco, CA', 'Chicago, IL', 'Austin, TX', 'Boston, MA', 'Seattle, WA', 'Remote'];

  // Fetch companies from database
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        // If admin, show only their company
        try {
          const res = await fetch('/api/user');
          const data = await res.json();
          if (data?.success && data.data?.user?.role === 'admin' && data.data?.company?.id) {
            setRestrictToAdmin(data.data.company.id);
          }
        } catch {}

        const response = await fetch('/api/companies');
        
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCompanies(data.data);
        } else {
          throw new Error(data.error || 'Failed to load companies');
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError(err instanceof Error ? err.message : 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company => {
    if (restrictToAdmin && company.id !== restrictToAdmin) return false;
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
    const matchesLocation = !selectedLocation || company.location === selectedLocation;
    
    return matchesSearch && matchesIndustry && matchesLocation;
  });

  const toggleFavorite = async (id: string) => {
    try {
      // Update favorite in database
      const response = await fetch(`/api/companies/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setCompanies(prev => prev.map(company => 
          company.id === id 
            ? { ...company, isFavorite: !company.isFavorite }
            : company
        ));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Fallback to local state update
      setCompanies(prev => prev.map(company => 
        company.id === id 
          ? { ...company, isFavorite: !company.isFavorite }
          : company
      ));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading companies...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Companies</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Discover Amazing Companies
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Explore top companies offering internships and career opportunities
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Industry Filter */}
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedIndustry('');
                  setSelectedLocation('');
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {filteredCompanies.length} of {companies.length} companies
            </p>
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-2xl">
                        {company.logo || '🏢'}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{company.industry}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(company.id)}
                    className={`p-2 rounded-full transition-colors ${
                      company.isFavorite
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <HeartIcon className={`w-5 h-5 ${company.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {company.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>{company.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    <span>{company.size}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <BriefcaseIcon className="w-4 h-4 mr-2" />
                    <span>{company.internshipCount} open internships</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                      >
                        <GlobeAltIcon className="w-4 h-4 mr-1" />
                        Website
                      </a>
                    )}
                  </div>
                  <Link href={`/internships?company=${company.id}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">View Internships</Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No companies found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria or check back later for new companies.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
