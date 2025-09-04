'use client';

import { useState, useEffect } from 'react';
import { 
  BriefcaseIcon, 
  UserIcon, 
  CalendarIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface Application {
  id: string;
  internshipId: string;
  internshipTitle: string;
  company: string;
  appliedDate: string;
  status: string;
  lastUpdated: string;
  coverLetter: string;
  resumeUrl: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function AdminDashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    fetchUserRole();
    fetchApplications();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      if (data.success) {
        setUserRole(data.data?.user?.role || '');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications');
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.data || []);
      } else {
        console.error('Error fetching applications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shortlisted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'interviewed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <ClockIcon className="w-4 h-4" />;
      case 'shortlisted': return <StarIcon className="w-4 h-4" />;
      case 'interviewed': return <EyeIcon className="w-4 h-4" />;
      case 'accepted': return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      applied: 0,
      shortlisted: 0,
      interviewed: 0,
      accepted: 0,
      rejected: 0,
    };
    
    applications.forEach(app => {
      if (counts.hasOwnProperty(app.status)) {
        counts[app.status as keyof typeof counts]++;
      }
    });
    
    return counts;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is admin or superadmin
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Only admins can access this page.</p>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage internship applications and track their progress
          </p>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applied</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.applied}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <StarIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Shortlisted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.shortlisted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <EyeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interviewed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.interviewed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.accepted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Applications ({applications.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {applications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No applications yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Applications will appear here when students start applying.
                </p>
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        {application.user.image ? (
                          <img
                            src={application.user.image}
                            alt={application.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {application.user.name}
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {application.user.email}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {application.internshipTitle} at {application.company}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <span className="flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            Applied: {new Date(application.appliedDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            Updated: {new Date(application.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(application.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                      
                      <a
                        href={`/dashboard/applications/${application.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
