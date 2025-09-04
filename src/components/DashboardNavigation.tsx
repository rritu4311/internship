'use client';

import { 
  ChartBarIcon,
  BriefcaseIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs = [
  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
  { id: 'applications', name: 'Applications', icon: BriefcaseIcon },
  { id: 'profile', name: 'Profile', icon: UserCircleIcon }
];

export default function DashboardNavigation({ activeTab, onTabChange }: DashboardNavigationProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
  );
}
