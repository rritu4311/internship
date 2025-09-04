import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db-init';

// Initialize database connection flag
let isDbInitialized = false;

export async function middleware(request: NextRequest) {
  // Only initialize the database once
  if (!isDbInitialized) {
    try {
      console.log('Initializing database connection...');
      isDbInitialized = await initializeDatabase();
      console.log('Database initialization status:', isDbInitialized ? 'Success' : 'Failed');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
  
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: '/api/:path*',
};