'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface HomeLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
}

export default function HomeLayout({ children, onSearch }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onSearch={onSearch} />
      
      <main>
        {children}
      </main>

      <Footer />
    </div>
  );
}
