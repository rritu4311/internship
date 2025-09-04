import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db-init';

// This route can be used to initialize the database connection
// It can be called during application startup or as needed
export async function GET() {
  try {
    const result = await initializeDatabase();
    
    if (result) {
      return NextResponse.json({ success: true, message: 'Database initialized successfully' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to initialize database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { success: false, message: 'Error initializing database', error: String(error) },
      { status: 500 }
    );
  }
}