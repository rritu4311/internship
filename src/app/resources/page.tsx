'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  UserGroupIcon,
  LightBulbIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'template' | 'course' | 'article';
  category: string;
  duration?: string;
  rating: number;
  views: number;
  isFree: boolean;
  tags: string[];
  thumbnail?: string;
}

const categories = [
  'All Categories',
  'Resume & CV',
  'Interview Prep',
  'Networking',
  'Skills Development',
  'Personal Branding',
  'Career Planning'
];

const resourceTypes = [
  'All Types',
  'guide',
  'video',
  'template',
  'course',
  'article'
];

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState('All Types');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/resources');
        if (!response.ok) throw new Error('Failed to fetch resources');
        const data = await response.json();
        if (data.success) {
          setResources(data.data);
        } else {
          throw new Error(data.error || 'Failed to load resources');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'All Categories' || resource.category === selectedCategory;
    const matchesType = selectedType === 'All Types' || resource.type === selectedType;
    const matchesFree = !showFreeOnly || resource.isFree;
    const matchesSearch = !searchQuery || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesType && matchesFree && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return <BookOpenIcon className="w-5 h-5" />;
      case 'video':
        return <VideoCameraIcon className="w-5 h-5" />;
      case 'template':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'course':
        return <AcademicCapIcon className="w-5 h-5" />;
      case 'article':
        return <DocumentTextIcon className="w-5 h-5" />;
      default:
        return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'video':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'template':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'course':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'article':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Career Resources & Guides
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Everything you need to succeed in your internship and career journey
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-large p-2">
              <div className="flex items-center px-4 py-3">
                <BookOpenIcon className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search resources, guides, or topics..."
                  className="flex-1 outline-none text-gray-700 dark:text-white bg-transparent placeholder-gray-500 dark:placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {resourceTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Free Only Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="freeOnly"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="freeOnly" className="text-sm text-gray-700 dark:text-gray-300">
                Free resources only
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredResources.length} Resources Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Discover valuable content to boost your career
              </p>
            </div>
          </div>

          {/* Resources Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Loading resources...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L2.298 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to load resources
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setSelectedType('All Types');
                  setShowFreeOnly(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-large transition-all duration-300"
                >
                  {/* Resource Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                        {getTypeIcon(resource.type)}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(resource.type)}`}>
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <StarIconSolid className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {resource.rating}
                      </span>
                    </div>
                  </div>

                  {/* Resource Content */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2 mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-3">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {resource.duration}
                      </span>
                      <span className="flex items-center">
                        <UserGroupIcon className="w-3 h-3 mr-1" />
                        {resource.views} views
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {resource.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                          +{resource.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resource Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className={`text-sm font-medium ${
                      resource.isFree 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-primary-600 dark:text-primary-400'
                    }`}>
                      {resource.isFree ? 'Free' : 'Premium'}
                    </span>
                    
                    <button className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors">
                      View Resource
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpenIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No resources found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setSelectedType('All Types');
                  setShowFreeOnly(false);
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Resources
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Most popular and highly-rated content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3)
              .map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:shadow-large transition-all duration-300"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Featured
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <StarIconSolid className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {resource.rating}
                      </span>
                    </div>
                    <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors">
                      Learn More
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
