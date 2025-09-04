import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MongoClient } from 'mongodb';

// GET /api/test-db - Test database connectivity
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connectivity...');
    
    // Test Prisma connection
    let prismaTest: { success: boolean; error: string | null } = { success: false, error: null };
    try {
      const userCount = await prisma.user.count();
      prismaTest = { success: true, error: null };
      console.log('Prisma test successful, user count:', userCount);
    } catch (error) {
      prismaTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      console.log('Prisma test failed:', error);
    }
    
    // Test MongoDB direct connection
    let mongoTest: { success: boolean; error: string | null; userCount: number; applicationCount: number } = { success: false, error: null, userCount: 0, applicationCount: 0 };
    try {
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      
      const userCount = await db.collection('User').countDocuments();
      const applicationCount = await db.collection('Application').countDocuments();
      
      await client.close();
      
      mongoTest = { success: true, error: null, userCount, applicationCount };
      console.log('MongoDB test successful, user count:', userCount, 'application count:', applicationCount);
    } catch (error) {
      mongoTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error', userCount: 0, applicationCount: 0 };
      console.log('MongoDB test failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        prisma: prismaTest,
        mongodb: mongoTest,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { success: false, error: 'Database test failed' },
      { status: 500 }
    );
  }
}
