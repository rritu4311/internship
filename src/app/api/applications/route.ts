import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/applications - Get user's applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check user role
    if (user.role === 'admin') {
      // Find the company owned by this admin
      const company = await prisma.company.findFirst({ where: { ownerId: user.id } });
      if (!company) {
        return NextResponse.json({ success: false, error: 'Admin does not own a company' }, { status: 403 });
      }
      // Find all internships for this company
      const internships = await prisma.internship.findMany({ where: { companyId: company.id }, select: { id: true } });
      const internshipIds = internships.map(i => i.id);
      const applications = await prisma.application.findMany({
        where: { internshipId: { in: internshipIds } },
        include: {
          internship: {
            include: {
              company: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      const formattedApplications = applications.map(app => ({
        id: app.id,
        internshipId: app.internshipId,
        internshipTitle: app.internship.title,
        company: app.internship.company.name,
        appliedDate: app.createdAt.toISOString(),
        status: app.status,
        lastUpdated: app.updatedAt.toISOString(),
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
      }));
      return NextResponse.json({ success: true, data: formattedApplications });
    } else if (user.role === 'superadmin') {
      // Super admin: see all applications
      const applications = await prisma.application.findMany({
        include: {
          internship: {
            include: {
              company: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      const formattedApplications = applications.map(app => ({
        id: app.id,
        internshipId: app.internshipId,
        internshipTitle: app.internship.title,
        company: app.internship.company.name,
        appliedDate: app.createdAt.toISOString(),
        status: app.status,
        lastUpdated: app.updatedAt.toISOString(),
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
      }));
      return NextResponse.json({ success: true, data: formattedApplications });
    } else {
      // Regular user: see only their own applications
      const applications = await prisma.application.findMany({
        where: { userId: user.id },
        include: {
          internship: {
            include: {
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      const formattedApplications = applications.map(app => ({
        id: app.id,
        internshipId: app.internshipId,
        internshipTitle: app.internship.title,
        company: app.internship.company.name,
        appliedDate: app.createdAt.toISOString(),
        status: app.status,
        lastUpdated: app.updatedAt.toISOString(),
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
      }));
      
      return NextResponse.json({
        success: true,
        data: formattedApplications,
      });
    }
    
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const { internshipId, coverLetter, resumeUrl, answers } = body;
    if (!internshipId) {
      return NextResponse.json({ success: false, error: 'Internship ID is required' }, { status: 400 });
    }
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    // Check for duplicate application
    const existing = await prisma.application.findFirst({ where: { internshipId, userId: user.id } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'You have already applied for this internship' }, { status: 400 });
    }
    // Create application
    const application = await prisma.application.create({
      data: {
        internshipId,
        userId: user.id,
        coverLetter,
        resumeUrl,
        answers,
        status: 'pending',
      },
    });
    return NextResponse.json({ success: true, data: application, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
