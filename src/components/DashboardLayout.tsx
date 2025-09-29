'use client';

import { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';
import Footer from './Footer';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function DashboardLayout({
  children,
  title = "Dashboard",
  description = "Manage your internship applications and profile"
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-secondary-foreground">{description}</p>
          </div>

          {/* Dashboard Content */}
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}
