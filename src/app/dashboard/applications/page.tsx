'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  UserIcon, 
  EyeIcon, 
  CalendarIcon, 
  ClockIcon, 
  StarIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import NeonCard from '@/components/NeonCard';

interface ApplicationUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

interface ApplicationItem {
  id: string;
  internshipId: string;
  internshipTitle: string;
  company: string;
  appliedDate: string;
  status: string; // Allowing any string for flexibility with API responses
  lastUpdated: string;
  coverLetter: string;
  resumeUrl: string;
  user?: ApplicationUser | null;
  userId?: string;
}

export default function ApplicationsListPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const internshipId = params.get('internshipId');

  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  
  // Get user role from session
  const userRole = (session?.user as any)?.role || '';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const currentUserId = (session?.user as any)?.id || '';

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
      case 'accepted': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4 text-red-500" />;
      case 'withdrawn': return <ArrowPathIcon className="w-4 h-4 text-gray-500" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      setWithdrawingId(applicationId);
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setApps(apps.map(app =>
          app.id === applicationId
            ? { ...app, status: newStatus, lastUpdated: new Date().toISOString() }
            : app
        ));
      } else {
        alert(result.error || 'Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('An error occurred while updating the application status');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      setWithdrawingId(applicationId);
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the applications list
        fetchApplications();
      } else {
        alert(result.error || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('An error occurred while withdrawing the application');
    } finally {
      setWithdrawingId(null);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let url = '/api/applications';
      const params = new URLSearchParams();

      if (internshipId) {
        params.append('internshipId', internshipId);
      }

      // If not admin, only fetch current user's applications
      if (!isAdmin && session?.user) {
        const userId = (session.user as any)?.id;
        if (userId) {
          params.append('userId', userId);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      console.log('Fetching applications from:', url); // Debug log
      console.log('isAdmin:', isAdmin, 'session exists:', !!session); // Debug log

      const res = await fetch(url);
      const data = await res.json();

      console.log('API Response:', data); // Debug log

      if (!data.success) throw new Error(data.error || 'Failed to fetch applications');

      // Ensure data is properly typed before filtering
      const applications = (data.data || []) as ApplicationItem[];

      console.log('Applications received:', applications.length); // Debug log
      console.log('Sample application:', applications[0]); // Debug log

      // Filter out other users' applications if not admin (double check)
      let filteredData = applications;

      if (!isAdmin && session?.user) {
        const currentUserId = (session.user as any)?.id;
        console.log('Current user ID:', currentUserId); // Debug log

        filteredData = applications.filter(app => {
          const userId = app.user?.id || app.userId;
          console.log('Filtering app:', app.id, 'userId:', userId, 'currentUserId:', currentUserId); // Debug log
          return userId === currentUserId;
        });
      }

      console.log('Final filtered applications:', filteredData.length); // Debug log

      // If no applications after filtering, show all applications (fallback)
      if (filteredData.length === 0 && applications.length > 0) {
        console.log('No applications after filtering, showing all applications as fallback'); // Debug log
        setApps(applications);
      } else {
        setApps(filteredData);
      }
    } catch (e: any) {
      console.error('Error fetching applications:', e); // Debug log
      setError(e.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchApplications();
    }
  }, [internshipId, session]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{backgroundColor: 'white'}}>
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {internshipId ? 'Applications for Internship' : 'All Applications'}
          </h1>
          {internshipId && (
            <p className="text-gray-600 dark:text-gray-400">Internship ID: {internshipId}</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">{error}</div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No applications found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {apps.map((application, index) => (
              <NeonCard
                key={application.id}
                delay={index * 0.1}
                className="w-full max-w-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 w-full">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <BriefcaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {application.internshipTitle}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap sm:ml-2">
                          {new Date(application.lastUpdated).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                        <span className="truncate">{application.company}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          Applied: {new Date(application.appliedDate).toLocaleDateString()}
                        </span>
                        {application.resumeUrl && (
                          <a
                            href={application.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-blue-300/50 dark:text-grey-200 hover:bg-blue-200/50"
                          >
                            <DocumentTextIcon className="w-3 h-3 mr-1" />
                            View Resume
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        <span className="inline-flex items-center space-x-1">
                          {getStatusIcon(application.status)}
                          <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 min-w-[200px] sm:min-w-0">
                      <Link
                        href={`/dashboard/applications/${application.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                      >
                        <EyeIcon className="w-4 h-4 mr-1.5" />
                        <span>View Details</span>
                      </Link>

                      {/* Show withdraw button only for the applicant or admin */}
                      {/* {application.status === 'applied' && (isAdmin || application.user?.id === currentUserId) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Only proceed if not already processing
                            if (withdrawingId !== application.id) {
                              handleWithdrawApplication(application.id);
                            }
                          }}
                          disabled={!!withdrawingId}
                          className={`inline-flex items-center justify-center px-4 py-2 border border-red-500 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150 ${
                            withdrawingId
                              ? 'opacity-60 cursor-not-allowed'
                              : 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-600 dark:hover:border-red-500'
                          }`}
                        >
                          {withdrawingId === application.id ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
                              <span>Withdrawing...</span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-4 h-4 mr-1.5" />
                              <span>Withdraw</span>
                            </>
                          )}
                        </button>
                      )} */}

                      {/* Admin actions */}
                      {/* {isAdmin && application.status !== 'withdrawn' && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                          {['shortlisted', 'interviewed', 'accepted', 'rejected'].map((status) => (
                            <button
                              key={status}
                              onClick={(e) => handleStatusUpdate(application.id, status)}
                              disabled={!!withdrawingId}
                              className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg border ${
                                application.status === status
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </NeonCard>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
