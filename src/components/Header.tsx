'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  XMarkIcon,
  UserCircleIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [applicationsCount, setApplicationsCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [userRole, setUserRole] = useState<string>('');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data?.success && Array.isArray(data.data?.applications)) {
          setApplicationsCount(data.data.applications.length);
        }
      } catch {}
    };
    fetchApplications();
  }, [session?.user?.email]);

  // Expose a stable function to fetch notifications so we can call it from an event listener
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setUnreadNotifications(data.data.filter((n: any) => !n.read).length);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
  }, [session?.user?.email]);

  // Listen to global notification updates to keep the bell count in sync
  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('notifications-updated', handler as any);
    return () => window.removeEventListener('notifications-updated', handler as any);
  }, []);

  // Fetch user role for conditional brand text
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (data?.success) {
          setUserRole(data.data?.user?.role || '');
        }
      } catch {}
    };
    fetchUserRole();
  }, [session?.user?.email]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const [nav, setNav] = useState([
    { name: 'Dashboard', href: '/' },
    { name: 'Internships', href: '/internships' },
    { name: 'Companies', href: '/companies' },
    { name: 'About', href: '/about' },
  ]);

  useEffect(() => {
    // Admins: Internships should route to their filtered view (already enforced server-side)
    // No change to links, server filters by role; keep nav minimal.
  }, [session?.user?.role]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-lg ${
        isScrolled
          ? 'bg-secondary/95 backdrop-blur-md shadow-soft'
          : 'bg-secondary'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center"
              >
              </motion.div>
              <span className="text-xl font-bold text-foreground" style={{ marginRight:'3rem',marginLeft:'-3.6rem' }}>
              {userRole !== 'admin' ? 'OnlyInternship.in' : 'Admin|OnlyInternship.in'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {nav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-foreground hover:text-primary-600 transition-colors font-medium"
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Desktop Search */}
              <div className="hidden lg:block">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-8 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      style={{ marginLeft:'1rem' }}
                      placeholder="Search internships..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    />
                  </div>
                </form>
              </div>

              {/* Google Sign In/Out */}
              {session ? (
                <button 
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  style={{ width:'7rem' }}
                  className="flex items-center space-x-1 p-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Image src="/google.svg" alt="Google Sign Out" width={20} height={20} />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              ) : (
                <button 
                  onClick={() => signIn('google')}
                  className="flex items-center space-x-1 p-2 bg-blue-50 text-primary hover:bg-blue-100 transition-colors"
                >
                  <Image src="/google.svg" alt="Google Sign In" width={20} height={20} />
                  <span className="text-sm font-medium">Sign In</span>
                </button>
              )}

              {/* Notifications */}
              <div className="relative">
                <Link 
                  href="/notifications"
                  className="p-2 text-foreground hover:text-primary transition-colors"
                >
                  <BellIcon className="w-5 h-5" />
                </Link>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                    {unreadNotifications}
                  </span>
                )}
              </div>

              {/* User menu */}
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-foreground hover:text-primary transition-colors"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </Link>
                
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search internships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-secondary border-t border-border"
            >
              <div className="px-4 py-4 space-y-4">
                {nav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{item.name}</span>
                  </Link>
                ))}
                <div className="pt-4 border-t border-border space-y-2">
                  <Link
                    href="/notifications"
                    className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BellIcon className="w-4 h-4" />
                    <span>Notifications</span>
                    {unreadNotifications > 0 && (
                      <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="block text-foreground hover:text-primary transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  
                  {session ? (
                    <button
                      className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors font-medium"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut({ callbackUrl: '/auth/signin' });
                      }}
                    >
                      <Image src="/google.svg" alt="Google Sign Out" width={20} height={20} />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors font-medium"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signIn('google');
                      }}
                    >
                      <Image src="/google.svg" alt="Google Sign In" width={20} height={20} />
                      <span>Sign In with Google</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

                         
    </>
  );
}
