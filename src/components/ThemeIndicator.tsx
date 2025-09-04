'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeIndicator() {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <AnimatePresence mode="wait">
        {theme === 'dark' ? (
          <motion.div
            key="dark-indicator"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 text-white rounded-full shadow-lg border border-gray-700"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <MoonIcon className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">Dark Mode</span>
          </motion.div>
        ) : (
          <motion.div
            key="light-indicator"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-white text-gray-800 rounded-full shadow-lg border border-gray-200"
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <SunIcon className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">Light Mode</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
