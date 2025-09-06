import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/debug-applications - Debug applications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Debugging applications for user:', session.user.email);

    // Check Prisma applications
    let prismaApps: any[] = [];
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          applications: {
            include: {
              internship: {
                include: {
                  company: { select: { name: true } },
                },
              },
            },
          },
        },
      });
      prismaApps = user?.applications || [];
      console.log('Prisma applications found:', prismaApps.length);
    } catch (error) {
      console.log('Prisma error:', error);
    }

    // Check MongoDB applications
    let mongoApps: any[] = [];
    try {
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      
      // Find user in MongoDB
      const mongoUser = await db.collection('User').findOne({ email: session.user.email });
      console.log('MongoDB user found:', !!mongoUser);
      
      if (mongoUser) {
        const apps = await db.collection('Application').find({ userId: mongoUser._id.toString() }).toArray();
        console.log('MongoDB applications found:', apps.length);
        
        // Get full application details
        mongoApps = await Promise.all(apps.map(async (app: any) => {
          try {
            const internship = await db.collection('Internship').findOne({ _id: new ObjectId(app.internshipId) });
            const company = internship ? await db.collection('Company').findOne({ _id: new ObjectId(internship.companyId) }) : null;
            
            return {
              id: app._id.toString(),
              internshipId: app.internshipId,
              internshipTitle: internship?.title || 'Unknown',
              company: company?.name || 'Unknown Company',
              status: app.status,
              appliedDate: app.createdAt,
              lastUpdated: app.updatedAt,
            };
          } catch (error) {
            console.error('Error processing app:', error);
            return null;
          }
        }));
        
        mongoApps = mongoApps.filter(app => app !== null);
      }
      
      await client.close();
    } catch (error) {
      console.log('MongoDB error:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        userEmail: session.user.email,
        prismaApplications: prismaApps,
        mongoApplications: mongoApps,
        totalApplications: prismaApps.length + mongoApps.length,
      },
    });
  } catch (error) {
    console.error('Debug applications error:', error);
    return NextResponse.json(
      { success: false, error: 'Debug failed' },
      { status: 500 }
    );
  }
}
