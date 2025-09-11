'use client';

import { useEffect, useState } from 'react';
import { 
  ChartBarIcon,
  BriefcaseIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const baseTabs = [
  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
  { id: 'applications', name: 'Applications', icon: BriefcaseIcon },
  { id: 'profile', name: 'Profile', icon: UserCircleIcon }
];

export default function DashboardNavigation({ activeTab, onTabChange }: DashboardNavigationProps) {
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data?.success) setRole(data.data?.user?.role || '');
      } catch {}
    })();
  }, []);

  const tabs = (role === 'admin' || role === 'superadmin')
    ? baseTabs.filter(t => t.id !== 'applications')
    : baseTabs;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-gray-800 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
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
