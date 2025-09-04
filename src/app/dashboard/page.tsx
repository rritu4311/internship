'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircleIcon,
  BookmarkIcon,
  BriefcaseIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  StarIcon,
  MapPinIcon,
  CalendarIcon,
  AcademicCapIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileForm from '@/components/ProfileForm';

interface Application {
  id: string;
  internshipId: string;
  internshipTitle: string;
  company: string;
  appliedDate: string;
  status: 'applied' | 'shortlisted' | 'interviewed' | 'accepted' | 'rejected';
  lastUpdated: string;
}

interface Profile {
  name: string;
  email: string;
  phone: string;
  location: string;
  education: string;
  specialization: string;
  graduationYear: string;
  skills: string[];
  bio: string;
  avatar?: string;
}

export default function DashboardPage() {
  // State for user data
  const [userData, setUserData] = useState<{
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: string;
    };
    profile: {
      bio: string | null;
      phoneNumber: string | null;
      location: string | null;
      skills: string[];
      education: any[];
      experience: any[];
      linkedinProfile: string | null;
      githubProfile: string | null;
      portfolioUrl: string | null;
    } | null;
    company?: any | null;
    internships?: any[];
    applications: Application[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: '',
    email: '',
    phone: '',
    location: '',
    education: '',
    specialization: '',
    graduationYear: '',
    skills: [],
    bio: ''
  });

  const isAdmin = userData?.user.role === 'admin' || userData?.user.role === 'superadmin';
  const tabs = isAdmin
    ? [
        { id: 'company', name: 'My Company', icon: BriefcaseIcon },
        { id: 'internships', name: 'My Internships', icon: BriefcaseIcon },
        { id: 'applications', name: 'Applications', icon: ChartBarIcon },
      ]
    : [
        { id: 'overview', name: 'Overview', icon: ChartBarIcon },
        { id: 'applications', name: 'Applications', icon: BriefcaseIcon },
        { id: 'profile', name: 'Profile', icon: UserCircleIcon },
      ];

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUserData(data.data);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Update profile when userData changes
  useEffect(() => {
    if (userData) {
      const newProfile: Profile = userData.profile ? {
        name: userData.user.name || '',
        email: userData.user.email || '',
        phone: userData.profile.phoneNumber || '',
        location: userData.profile.location || '',
        education: userData.profile.education && userData.profile.education.length > 0 ? 
          userData.profile.education[0].degree : '',
        specialization: userData.profile.education && userData.profile.education.length > 0 ? 
          userData.profile.education[0].fieldOfStudy : '',
        graduationYear: userData.profile.education && userData.profile.education.length > 0 ? 
          userData.profile.education[0].endDate : '',
        skills: userData.profile.skills || [],
        bio: userData.profile.bio || '',
        avatar: userData.user.image || undefined
      } : {
        name: userData.user.name || '',
        email: userData.user.email || '',
        phone: '',
        location: '',
        education: '',
        specialization: '',
        graduationYear: '',
        skills: [],
        bio: ''
      };
      setProfile(newProfile);
    }
  }, [userData]);

  // Define stats after applications is available
  const applications = userData?.applications || [];
  const stats = [
    { label: 'Applications', value: applications.length, icon: BriefcaseIcon },
    { label: 'Shortlisted', value: applications.filter(app => app.status === 'shortlisted').length, icon: StarIcon },
    { label: 'Interviews', value: applications.filter(app => app.status === 'interviewed').length, icon: EyeIcon },
    { label: 'Accepted', value: applications.filter(app => app.status === 'accepted').length, icon: CheckCircleIcon }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shortlisted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <ClockIcon className="w-4 h-4" />;
      case 'shortlisted':
        return <StarIcon className="w-4 h-4" />;
      case 'interviewed':
        return <BriefcaseIcon className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className="text-primary-600 dark:text-primary-400">
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
        </div>
        <div className="p-6">
          {applications.slice(0, 3).map((application) => (
            <div key={application.id} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">{application.internshipTitle}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{application.company}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Applied on {new Date(application.appliedDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
          <div className="mt-4">
            <a href="#applications" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
              View all applications →
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      {applications.map((application) => (
        <motion.div
          key={application.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {application.internshipTitle}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{application.company}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
                <span>Updated: {new Date(application.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(application.status)}
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
              View Details
            </button>
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm">
              Withdraw Application
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderCompany = () => (
    <div className="space-y-6">
      <div className="flex justify-end">
        <a href="/dashboard/company/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Register Company</a>
      </div>
      {(userData as any)?.companies && (userData as any).companies.length > 0 ? (
        (userData as any).companies.map((c: any) => (
          <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{c.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{c.description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">{c.location} • {c.industry}</p>
          </div>
        ))
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="mb-4 text-gray-600 dark:text-gray-400">You do not have a company yet.</p>
          <a href="/dashboard/company/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Register Company</a>
        </div>
      )}
    </div>
  );

  const renderAdminInternships = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Internships</h3>
        <a href="/dashboard/internships/new" className="px-3 py-2 bg-primary-600 text-white rounded-md">Add Internship</a>
      </div>
      {(userData?.internships || []).map((i: any) => (
        <div key={i.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{i.title}</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{i.location} • {i.locationType} • {i.duration} weeks</p>
            </div>
            {i.createdAt && (
              <span className="text-sm text-gray-500 dark:text-gray-500">{new Date(i.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      {isEditingProfile ? (
        <ProfileForm
          initialData={{
            firstName: profile.name.split(' ')[0] || '',
            lastName: profile.name.split(' ').slice(1).join(' ') || '',
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            education: profile.education,
            specialization: profile.specialization,
            skills: profile.skills,
            bio: profile.bio
          }}
          onSave={(data) => {
            setProfile({
              ...profile,
              name: `${data.firstName} ${data.lastName}`.trim(),
              email: data.email,
              phone: data.phone,
              location: data.location,
              education: data.education,
              specialization: data.specialization,
              skills: data.skills,
              bio: data.bio
            });
            setIsEditingProfile(false);
          }}
          isEditing={true}
          onCancel={() => setIsEditingProfile(false)}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit Profile
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.phone}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.location}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Education</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.education}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialization</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {profile.specialization}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {profile.bio || 'No bio added yet.'}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No skills added yet.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold mt-4 text-gray-800 dark:text-white">Error Loading Dashboard</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your internship applications and profile</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'overview' && !isAdmin && renderOverview()}
            {activeTab === 'applications' && renderApplications()}
            {activeTab === 'profile' && !isAdmin && renderProfile()}
            {activeTab === 'company' && isAdmin && renderCompany()}
            {activeTab === 'internships' && isAdmin && renderAdminInternships()}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
