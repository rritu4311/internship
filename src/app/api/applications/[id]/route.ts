import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/applications/[id] - Get application details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const applicationId = params.id;
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Try Prisma first
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          internship: {
            include: {
              company: {
                select: {
                  name: true,
                  ownerId: true,
                },
              },
            },
          },
        },
      });

      if (!application) {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }

      // Check permissions
      if (currentUser.role === 'student') {
        // Students can only view their own applications
        if (application.userId !== currentUser.id) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      } else if (currentUser.role === 'admin') {
        // Admins can only view applications for their company
        const company = await prisma.company.findFirst({
          where: { ownerId: currentUser.id },
        });
        
        if (!company || application.internship.companyId !== company.id) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      }
      // Superadmins can view all applications

      const formattedApplication = {
        id: application.id,
        internshipId: application.internshipId,
        internshipTitle: application.internship.title,
        company: application.internship.company.name,
        appliedDate: application.createdAt.toISOString(),
        status: application.status,
        lastUpdated: application.updatedAt.toISOString(),
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl,
        user: application.user,
      };

      return NextResponse.json({
        success: true,
        data: formattedApplication,
      });
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
      
      const applicationsCollection = db.collection('Application');
      const usersCollection = db.collection('User');
      const internshipsCollection = db.collection('Internship');
      const companiesCollection = db.collection('Company');

      const application = await applicationsCollection.findOne({
        _id: new ObjectId(applicationId),
      });

      if (!application) {
        await client.close();
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }

      // Get user details
      const user = await usersCollection.findOne({
        _id: new ObjectId(application.userId),
      });

      if (!user) {
        await client.close();
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Get internship and company details
      const internship = await internshipsCollection.findOne({
        _id: new ObjectId(application.internshipId),
      });

      if (!internship) {
        await client.close();
        return NextResponse.json(
          { success: false, error: 'Internship not found' },
          { status: 404 }
        );
      }

      const company = await companiesCollection.findOne({
        _id: new ObjectId(internship.companyId),
      });

      if (!company) {
        await client.close();
        return NextResponse.json(
          { success: false, error: 'Company not found' },
          { status: 404 }
        );
      }

      // Check permissions for MongoDB data
      if (currentUser.role === 'student') {
        // Students can only view their own applications
        if (application.userId !== currentUser.id) {
          await client.close();
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      } else if (currentUser.role === 'admin') {
        // Admins can only view applications for their company
        const adminCompany = await companiesCollection.findOne({
          ownerId: currentUser.id,
        });
        
        if (!adminCompany || internship.companyId !== adminCompany._id.toString()) {
          await client.close();
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          );
        }
      }

      const formattedApplication = {
        id: application._id.toString(),
        internshipId: application.internshipId,
        internshipTitle: internship.title,
        company: company.name,
        appliedDate: application.createdAt.toISOString(),
        status: application.status,
        lastUpdated: application.updatedAt.toISOString(),
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        },
      };

      await client.close();
      return NextResponse.json({
        success: true,
        data: formattedApplication,
      });
    } catch (mongoError) {
      console.error('MongoDB fallback failed:', mongoError);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch application' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error fetching application details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
