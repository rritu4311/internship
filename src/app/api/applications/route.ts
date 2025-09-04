import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId } from 'mongodb';
import { prisma } from '@/lib/db';

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
    const { internshipId, coverLetter, resumeUrl, answers } = body || {};
    if (!internshipId || typeof internshipId !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid internshipId is required' }, { status: 400 });
    }
    if (!coverLetter || typeof coverLetter !== 'string') {
      return NextResponse.json({ success: false, error: 'Cover letter is required' }, { status: 400 });
    }
    // Attempt with Prisma first
    try {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      const targetInternship = await prisma.internship.findUnique({ where: { id: internshipId }, include: { company: true } });
      if (!targetInternship) {
        return NextResponse.json({ success: false, error: 'Internship not found' }, { status: 404 });
      }
      if (targetInternship.status !== 'open') {
        return NextResponse.json({ success: false, error: 'Applications are closed for this internship' }, { status: 400 });
      }
      const existing = await prisma.application.findFirst({ where: { internshipId, userId: user.id } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'You have already applied for this internship' }, { status: 400 });
      }
      const application = await prisma.application.create({
        data: { internshipId, userId: user.id, coverLetter, resumeUrl, answers, status: 'applied' },
      });
      await (prisma as any).notification.create({
        data: { userId: targetInternship.company.ownerId, type: 'new_application', message: `New application for ${targetInternship.title}` },
      }).catch(() => {});
      return NextResponse.json({ success: true, data: application, message: 'Application submitted successfully' });
    } catch (e) {
      // Fallback to Mongo driver to avoid Prisma replica set limitations
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const usersCol = db.collection('User');
      const internshipsCol = db.collection('Internship');
      const applicationsCol = db.collection('Application');

      const user = await usersCol.findOne({ email: session.user.email });
      if (!user) { await client.close(); return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 }); }
      const oid = (() => { try { return new ObjectId(internshipId); } catch { return null; } })();
      if (!oid) { await client.close(); return NextResponse.json({ success: false, error: 'Invalid internshipId' }, { status: 400 }); }
      const targetInternship = await internshipsCol.findOne({ _id: oid });
      if (!targetInternship) { await client.close(); return NextResponse.json({ success: false, error: 'Internship not found' }, { status: 404 }); }
      if (targetInternship.status !== 'open') { await client.close(); return NextResponse.json({ success: false, error: 'Applications are closed for this internship' }, { status: 400 }); }
      const existing = await applicationsCol.findOne({ userId: String(user._id), internshipId: internshipId });
      if (existing) { await client.close(); return NextResponse.json({ success: false, error: 'You have already applied for this internship' }, { status: 400 }); }
      const insertRes = await applicationsCol.insertOne({
        userId: String(user._id),
        internshipId: internshipId, // Use the original internshipId parameter
        status: 'applied',
        coverLetter,
        resumeUrl,
        answers,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await client.close();
      return NextResponse.json({ success: true, data: { id: String(insertRes.insertedId) }, message: 'Application submitted successfully' });
    }
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/applications - Update application status (admin/superadmin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, status } = body as { applicationId?: string; status?: string };
    if (!applicationId || !status) {
      return NextResponse.json({ success: false, error: 'applicationId and status are required' }, { status: 400 });
    }

    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!actor) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (actor.role !== 'admin' && actor.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Ensure admin can only update apps for their company
    if (actor.role === 'admin') {
      const company = await prisma.company.findFirst({ where: { ownerId: actor.id } });
      if (!company) {
        return NextResponse.json({ success: false, error: 'Admin does not own a company' }, { status: 403 });
      }
      const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { internship: true } });
      if (!app || app.internship.companyId !== company.id) {
        return NextResponse.json({ success: false, error: 'Application not found for your company' }, { status: 404 });
      }
    }

    const updated = await prisma.application.update({ 
      where: { id: applicationId }, 
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        internship: { 
          include: { 
            company: { select: { name: true } } 
          } 
        }
      }
    });
    
    // Create detailed notification message
    const statusMessages = {
      'shortlisted': `Congratulations! Your application for ${updated.internship.title} at ${updated.internship.company.name} has been shortlisted. You're one step closer to getting the internship!`,
      'interviewed': `Great news! You've been selected for an interview for ${updated.internship.title} at ${updated.internship.company.name}. Please check your email for interview details.`,
      'accepted': `🎉 Congratulations! Your application for ${updated.internship.title} at ${updated.internship.company.name} has been accepted! Welcome to the team!`,
      'rejected': `We regret to inform you that your application for ${updated.internship.title} at ${updated.internship.company.name} was not successful this time. Thank you for your interest.`
    };
    
    const notificationMessage = statusMessages[status as keyof typeof statusMessages] || 
      `Your application status for ${updated.internship.title} has been updated to ${status}`;
    
    // Notify applicant about status change
    await (prisma as any).notification.create({
      data: {
        userId: updated.userId,
        type: 'application_status',
        message: notificationMessage,
      },
    }).catch((error: any) => {
      console.error('Failed to create notification:', error);
    });
    
    return NextResponse.json({ success: true, data: updated, message: 'Application status updated' });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
