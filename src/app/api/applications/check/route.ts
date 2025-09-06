import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/applications/check?internshipId=xxx - Check if user has applied for an internship
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const internshipId = searchParams.get('internshipId');

    if (!internshipId) {
      return NextResponse.json(
        { success: false, error: 'internshipId is required' },
        { status: 400 }
      );
    }

    // Try Prisma first
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        const application = await prisma.application.findFirst({
          where: {
            internshipId,
            userId: user.id,
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (application) {
          return NextResponse.json({
            success: true,
            data: {
              hasApplied: true,
              applicationId: application.id,
              status: application.status,
              appliedDate: application.createdAt.toISOString(),
              lastUpdated: application.updatedAt.toISOString(),
            },
          });
        }
      }
    } catch (prismaError) {
      console.log('Prisma failed, trying MongoDB:', prismaError);
    }

    // Fallback to MongoDB
    try {
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const usersCollection = db.collection('User');
      const applicationsCollection = db.collection('Application');

      const user = await usersCollection.findOne({ email: session.user.email });
      
      if (user) {
        const application = await applicationsCollection.findOne({
          userId: user._id.toString(),
          internshipId: internshipId,
        });

        if (application) {
          await client.close();
          return NextResponse.json({
            success: true,
            data: {
              hasApplied: true,
              applicationId: application._id.toString(),
              status: application.status,
              appliedDate: application.createdAt.toISOString(),
              lastUpdated: application.updatedAt.toISOString(),
            },
          });
        }
      }
      
      await client.close();
    } catch (mongoError) {
      console.error('MongoDB fallback failed:', mongoError);
    }

    return NextResponse.json({
      success: true,
      data: {
        hasApplied: false,
      },
    });
  } catch (error) {
    console.error('Error checking application:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
