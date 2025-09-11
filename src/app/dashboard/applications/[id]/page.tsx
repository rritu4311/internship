'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface ApplicationDetails {
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

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      setUserRole((session.user as any)?.role || '');
      fetchApplicationDetails();
    }
  }, [applicationId, status, session]);

  const fetchApplicationDetails = async () => {
    if (!session?.user?.email) {
      console.error('No user session found');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${applicationId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // This will include the session cookie
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch application details');
      }
      
      const data = await response.json();
      if (data.success) {
        setApplication(data.data);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      // Show error message to user
      alert(error instanceof Error ? error.message : 'An error occurred');
      router.push('/dashboard/applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (newStatus: string) => {
    if (!application || !session) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      
      if (data.success) {
        setApplication(prev => prev ? { ...prev, status: newStatus, lastUpdated: new Date().toISOString() } : null);
        // Show success message
        alert(`Application status updated to ${newStatus}`);
        // Optionally refetch to sync any other fields
        fetchApplicationDetails();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Error updating application status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shortlisted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'interviewed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
      case 'withdrawn': return <XCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getAvailableActions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'applied':
        return [
          { action: 'shortlisted', label: 'Shortlist', color: 'bg-yellow-600 hover:bg-yellow-700' },
          { action: 'rejected', label: 'Reject', color: 'bg-red-600 hover:bg-red-700' }
        ];
      case 'shortlisted':
        return [
          { action: 'interviewed', label: 'Schedule Interview', color: 'bg-purple-600 hover:bg-purple-700' },
          { action: 'rejected', label: 'Reject', color: 'bg-red-600 hover:bg-red-700' }
        ];
      case 'interviewed':
        return [
          { action: 'accepted', label: 'Accept', color: 'bg-green-600 hover:bg-green-700' },
          { action: 'rejected', label: 'Reject', color: 'bg-red-600 hover:bg-red-700' }
        ];
      case 'accepted':
      case 'rejected':
      case 'withdrawn':
        return []; // No further actions for terminal states
      default:
        return [];
    }
  };

  // Add debug logging
  console.log('Session:', {
    user: session?.user,
    applicationUser: application?.user,
    isOwner: application?.user?.id === (session?.user as any)?.id || 
             application?.user?.email === session?.user?.email,
    isAdmin: userRole === 'admin' || userRole === 'superadmin'
  });

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting to login...</p>
      </div>
    );
  }
  
  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Application Not Found</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if user has permission to view this application
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isOwner = application.user.id === (session?.user as any)?.id || 
                 application.user.email === session?.user?.email;
  
  if (!isAdmin && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {session?.user ? 'You are not authorized to view this application.' : 'Please sign in to view this application.'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Handle withdraw application
  const handleWithdraw = async () => {
    if (window.confirm('Are you sure you want to withdraw your application? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/applications/${application.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (data.success) {
          alert('Application withdrawn successfully');
          router.push('/dashboard/applications');
        } else {
          alert(data.error || 'Failed to withdraw application');
        }
      } catch (error) {
        console.error('Error withdrawing application:', error);
        alert('An error occurred while withdrawing your application');
      }
    }
  };

  const availableActions = getAvailableActions(application.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Applications
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Application Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {application.internshipTitle} at {application.company}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(application.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>
              
              {/* Withdraw button for students */}
              {userRole === 'student' && !['withdrawn', 'rejected', 'accepted'].includes(application.status) && (
                <button
                  onClick={handleWithdraw}
                  disabled={updating}
                  className="px-4 py-1.5 text-sm font-medium text-red-600 hover:text-white border border-red-600 hover:bg-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Withdrawing...' : 'Withdraw Application'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Applicant Information
              </h2>
              
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {application.user.image ? (
                    <img
                      src={application.user.image}
                      alt={application.user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {application.user.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {application.user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Cover Letter
              </h2>
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {application.coverLetter || 'No cover letter provided.'}
                </p>
              </div>
            </div>

            {/* Resume */}
            {application.resumeUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Resume
                </h2>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Resume Document</p>
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Resume
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Timeline
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Applied</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(application.appliedDate).toLocaleDateString()} at {new Date(application.appliedDate).toLocaleTimeString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(application.lastUpdated).toLocaleDateString()} at {new Date(application.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Application Actions - visible to admins only */}
            {isAdmin && availableActions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BriefcaseIcon className="w-5 h-5 mr-2" />
                  Actions
                </h2>
                
                <div className="space-y-3">
                  {availableActions.map((action) => (
                    <button
                      key={action.action}
                      onClick={() => updateApplicationStatus(action.action)}
                      disabled={updating}
                      className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${action.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updating ? 'Updating...' : action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Status Information
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(application.status)}`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
                
                {application.status === 'accepted' && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      This application has been accepted. The candidate is ready to join.
                    </p>
                  </div>
                )}
                
                {application.status === 'rejected' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      This application has been rejected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
