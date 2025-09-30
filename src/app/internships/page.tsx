'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  BriefcaseIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  BookmarkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NeonCard from '@/components/NeonCard';

interface Internship {
  id: string;
  companyId: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: string;
  duration: string;
  stipend: string;
  postedDate: string;
  description: string;
  requirements: string[];
  skills: string[];
  isBookmarked: boolean;
  applicationStatus?: {
    hasApplied: boolean;
    status?: string;
    appliedDate?: string;
    lastUpdated?: string;
  };
}

interface ApplicationModalProps {
  internship: Internship | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationData) => void;
  loading: boolean;
}

interface ApplicationData {
  coverLetter: string;
  resumeUrl: string;
}

export default function InternshipsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationModal, setApplicationModal] = useState<{
    isOpen: boolean;
    internship: Internship | null;
  }>({ isOpen: false, internship: null });
  const [applying, setApplying] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isAdminContext, setIsAdminContext] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);

  const locations = ['New York, NY', 'San Francisco, CA', 'Chicago, IL', 'Austin, TX', 'Remote'];
  const types = ['Full-time', 'Part-time', 'Remote', 'Hybrid'];

  // Check for company query param and determine admin context. Also load companies for selector.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('company');
    if (companyId) {
      setSelectedCompany(companyId);
    }
    (async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data?.success && (data.data?.user?.role === 'admin' || data.data?.user?.role === 'superadmin')) {
          setIsAdminContext(true);
          const owned = (data.data?.companies || []).map((c: any) => ({ id: c.id, name: c.name }));
          setCompanies(owned);
        } else if (data?.success && data.data?.companies) {
          // company-role or others with companies in response
          const owned = (data.data?.companies || []).map((c: any) => ({ id: c.id, name: c.name }));
          setCompanies(owned);
        }
      } catch {}
    })();
  }, []);

  // Function to check application status for an internship
  const checkApplicationStatus = async (internshipId: string) => {
    try {
      console.log('Checking application status for internship:', internshipId);
      const response = await fetch(`/api/applications/check?internshipId=${internshipId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Application status response:', data);
        return data.success ? data.data : { hasApplied: false };
      } else {
        console.error('Application status check failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
    return { hasApplied: false };
  };

  // Fetch internships from database
  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        let apiUrl = '/api/internships';
        if (selectedCompany) {
          apiUrl += `?companyId=${selectedCompany}`;
        }
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch internships');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const internships = data.data;
          
          // Check application status for each internship if user is logged in
          if (session?.user) {
            const internshipsWithStatus = await Promise.all(
              internships.map(async (internship: Internship) => {
                const applicationStatus = await checkApplicationStatus(internship.id);
                return {
                  ...internship,
                  applicationStatus,
                };
              })
            );
            setInternships(internshipsWithStatus);
          } else {
            setInternships(internships);
          }
        } else {
          throw new Error(data.error || 'Failed to load internships');
        }
      } catch (err) {
        console.error('Error fetching internships:', err);
        setError(err instanceof Error ? err.message : 'Failed to load internships');
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [selectedCompany, session?.user]); // Add session.user to dependency array

  const filteredInternships = internships.filter(internship => {
    // If selectedCompany is set, only show internships for that company
    if (selectedCompany && internship.companyId !== selectedCompany) {
      return false;
    }
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = !selectedLocation || internship.location === selectedLocation;
    const matchesType = !selectedType || internship.type === selectedType;
    
    return matchesSearch && matchesLocation && matchesType;
  });

  const handleApply = async (applicationData: ApplicationData) => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    setApplying(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          internshipId: applicationModal.internship?.id,
          coverLetter: applicationData.coverLetter,
          resumeUrl: applicationData.resumeUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Close modal and show success message
        setApplicationModal({ isOpen: false, internship: null });
        alert('Application submitted successfully!');
        
        // Refresh the internships list to show updated application status
        const fetchInternships = async () => {
          try {
            let apiUrl = '/api/internships';
            if (selectedCompany) {
              apiUrl += `?companyId=${selectedCompany}`;
            }
            const response = await fetch(apiUrl);
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                const internships = data.data;
                
                // Check application status for each internship
                if (session?.user) {
                  const internshipsWithStatus = await Promise.all(
                    internships.map(async (internship: Internship) => {
                      const applicationStatus = await checkApplicationStatus(internship.id);
                      return {
                        ...internship,
                        applicationStatus,
                      };
                    })
                  );
                  setInternships(internshipsWithStatus);
                } else {
                  setInternships(internships);
                }
              }
            }
          } catch (err) {
            console.error('Error refreshing internships:', err);
          }
        };
        
        fetchInternships();
        
        // Also trigger a dashboard refresh if user is on dashboard
        if (window.location.pathname === '/dashboard') {
          window.location.reload();
        }
      } else {
        alert(data.error || 'Failed to submit application');
      }
    } catch (error) {
      alert('An error occurred while submitting your application');
    } finally {
      setApplying(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  // Function to calculate time difference
  const getTimeDifference = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  };

  const toggleBookmark = (internshipId: string) => {
    setInternships(prev => 
      prev.map(internship => 
        internship.id === internshipId 
          ? { ...internship, isBookmarked: !internship.isBookmarked }
          : internship
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading internships...</p>
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Internships</h3>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{backgroundColor: 'white'}}>
      <Header />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Find Your Perfect Internship
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover exciting opportunities to kickstart your career with top companies worldwide
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Company Filter (visible for admins and when companies are available) */}
              {(isAdminContext && companies.length > 0) && (
                <select
                  value={selectedCompany || ''}
                  onChange={(e) => setSelectedCompany(e.target.value || null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search internships..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

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

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLocation('');
                  setSelectedType('');
                  // Do not clear selectedCompany implicitly to avoid surprising admin filters
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
              Showing {filteredInternships.length} of {internships.length} internships
            </p>
          </div>

          {/* Internships Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInternships.map((internship, index) => (
              <NeonCard
                key={internship.id}
                delay={index * 0.1}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {internship.title}
                    </h3>
                    <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-1">
                      {internship.company}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleBookmark(internship.id)}
                    className={`p-2 rounded-full transition-colors ${
                      internship.isBookmarked
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <BookmarkIcon className={`w-5 h-5 ${internship.isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    <span>{internship.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <BriefcaseIcon className="w-4 h-4 mr-2" />
                    <span>{internship.type}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    <span>{internship.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                    <span>{internship.stipend}</span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {internship.description}
                </p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Required Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {internship.skills.slice(0, 4).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {internship.skills.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        +{internship.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Posted {new Date(internship.postedDate).toLocaleDateString()}
                  </span>
                  {(session?.user?.role === 'admin' || session?.user?.role === 'superadmin') ? (
                    <a
                      href={`/dashboard/applications?internshipId=${internship.id}`}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                    >
                      Check Applications
                    </a>
                  ) : (
                    <div className="flex flex-col items-end">
                      {internship.applicationStatus?.hasApplied ? (
                        <>
                          <button 
                            disabled
                            className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                          >
                            Applied
                          </button>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getTimeDifference(internship.applicationStatus.appliedDate || internship.applicationStatus.lastUpdated || '')}
                          </span>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            setApplicationModal({ isOpen: true, internship });
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </NeonCard>
            ))}
          </div>

          {/* No Results */}
          {filteredInternships.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No internships found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
