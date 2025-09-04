'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemePreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemePreferences({ isOpen, onClose }: ThemePreferencesProps) {
  const { theme, setTheme } = useTheme();
  const [autoTheme, setAutoTheme] = useState(true);

  const themeOptions = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: SunIcon,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes',
      icon: MoonIcon,
      color: 'from-blue-600 to-purple-600'
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follows your device settings',
      icon: ComputerDesktopIcon,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === 'system') {
      setAutoTheme(true);
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } else {
      setAutoTheme(false);
      setTheme(newTheme as 'light' | 'dark');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg">
                  <Cog6ToothIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Theme Preferences
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose your preferred theme
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = (autoTheme && option.id === 'system') || 
                                 (!autoTheme && option.id === theme);
                
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleThemeChange(option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${option.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {option.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Your theme preference will be saved and applied across all pages
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
