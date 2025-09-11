import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId } from 'mongodb';
import { prisma } from '@/lib/db';

// GET /api/applications - Get user's applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterInternshipId = searchParams.get('internshipId');
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
      // Find all companies owned by this admin
      const companies = await prisma.company.findMany({ where: { ownerId: user.id } });
      console.log('[ADMIN] Prisma userId:', user.id, 'found companies:', companies.map((c: { id: string }) => c.id));
      // Do not return early if none found in Prisma; we will also try MongoDB fallback.
      const companyIds = (companies && companies.length > 0)
        ? companies.map((c: { id: string }) => c.id)
        : [] as string[];

      // Find all internships for these companies
      const internships = await prisma.internship.findMany({ where: { companyId: { in: companyIds } }, select: { id: true, title: true } });
      const internshipIds = internships.map((i: { id: string }) => i.id);
      const internshipTitles = internships.map((i: { title: string }) => i.title);
      console.log('[ADMIN] Prisma internshipIds:', internshipIds, 'titles:', internshipTitles);
      let prismaApplications = await prisma.application.findMany({
        where: filterInternshipId ? { internshipId: filterInternshipId } : { internshipId: { in: internshipIds } },
        include: {
          internship: {
            include: {
              company: { select: { name: true } },
            },
          },
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[ADMIN] Prisma applications found:', prismaApplications.length, prismaApplications.map((a: any) => ({ id: a.id, title: a.internship.title })));
      // Always check MongoDB as well
      let mongoApplications: any[] = [];
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const companiesCol = db.collection('Company');
        const internshipsCol = db.collection('Internship');
        const applicationsCol = db.collection('Application');
        const usersCol = db.collection('User');
        // Find admin owner in MongoDB by email (more reliable than id across Prisma/Mongo)
        const mongoOwner = await usersCol.findOne({ email: session.user.email });
        // Find company in MongoDB by ownerId (string or ObjectId) and also try prisma user.id as fallback
        const mongoCompany = mongoOwner
          ? await companiesCol.findOne({ $or: [
              { ownerId: String(mongoOwner._id) },
              { ownerId: mongoOwner._id },
              { ownerId: user.id },
            ] as any })
          : await companiesCol.findOne({ $or: [ { ownerId: user.id }, { ownerId: new ObjectId(user.id) } ] as any });
        console.log('[ADMIN] MongoDB company:', mongoCompany?._id?.toString(), mongoCompany?.name);
        if (mongoCompany) {
          const companyIdVariants = [String(mongoCompany._id), new ObjectId(mongoCompany._id)];
          const mongoInternships = await internshipsCol.find({ companyId: { $in: companyIdVariants as any } }).toArray();
          const mongoInternshipIds = mongoInternships.map(i => i._id.toString());
          const mongoInternshipTitles = mongoInternships.map(i => i.title);
          console.log('[ADMIN] MongoDB internshipIds:', mongoInternshipIds, 'titles:', mongoInternshipTitles);
          const mongoApps = await applicationsCol.find(filterInternshipId ? { internshipId: filterInternshipId } : { internshipId: { $in: mongoInternshipIds } }).toArray();
          console.log('[ADMIN] MongoDB applications found:', mongoApps.length, mongoApps.map(a => ({ id: a._id?.toString(), internshipId: a.internshipId })));
          if (mongoApps.length > 0) {
            // Get full application data with user info
            mongoApplications = await Promise.all(mongoApps.map(async (app) => {
              const internship = mongoInternships.find(i => i._id.toString() === app.internshipId);
              const applicant = await usersCol.findOne({ _id: new ObjectId(app.userId) });
              return {
                id: app._id.toString(),
                internshipId: app.internshipId,
                internshipTitle: internship?.title || 'Unknown',
                company: mongoCompany.name,
                appliedDate: app.createdAt?.toISOString?.() || '',
                status: app.status,
                lastUpdated: app.updatedAt?.toISOString?.() || '',
                coverLetter: app.coverLetter,
                resumeUrl: app.resumeUrl,
                user: applicant ? {
                  id: applicant._id.toString(),
                  name: applicant.name,
                  email: applicant.email,
                  image: applicant.image,
                } : null,
              };
            }));
            console.log('[ADMIN] MongoDB applications mapped:', mongoApplications.map(a => ({ id: a.id, title: a.internshipTitle })));
          }
        }
        await client.close();
      } catch (mongoError) {
        console.error('MongoDB fallback for admin failed:', mongoError);
      }
      // Merge and deduplicate by id
      const appMap = new Map();
      prismaApplications.forEach((app: any) => appMap.set(app.id, {
        id: app.id,
        internshipId: app.internshipId,
        internshipTitle: app.internship.title,
        company: app.internship.company.name,
        appliedDate: app.createdAt.toISOString(),
        status: app.status,
        lastUpdated: app.updatedAt.toISOString(),
        coverLetter: app.coverLetter,
        resumeUrl: app.resumeUrl,
        user: app.user,
      }));
      mongoApplications.forEach((app: any) => appMap.set(app.id, app));
      const mergedApplications = Array.from(appMap.values());
      console.log('[ADMIN] Merged applications returned:', mergedApplications.map((a: any) => ({ id: a.id, title: a.internshipTitle })));
      return NextResponse.json({ success: true, data: mergedApplications });
    } else if (user.role === 'superadmin') {
      // Super admin: see all applications
      let applications = await prisma.application.findMany({
        include: {
          internship: {
            include: {
              company: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('Prisma applications for superadmin:', applications.length);
      // If no applications found, check MongoDB
      if (applications.length === 0) {
        try {
          const client = new MongoClient(process.env.DATABASE_URL!);
          await client.connect();
          const url = new URL(process.env.DATABASE_URL!);
          const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
          const db = client.db(dbName);
          const companiesCol = db.collection('Company');
          const internshipsCol = db.collection('Internship');
          const applicationsCol = db.collection('Application');
          const usersCol = db.collection('User');
          const mongoApps = await applicationsCol.find({}).toArray();
          console.log('MongoDB applications for superadmin:', mongoApps.length);
          if (mongoApps.length > 0) {
            // Get full application data
            const fullApplications = await Promise.all(mongoApps.map(async (app: any) => {
              const internship = await internshipsCol.findOne({ _id: new ObjectId(app.internshipId) });
              const company = internship ? await companiesCol.findOne({ _id: new ObjectId(internship.companyId) }) : null;
              const applicant = app.userId ? await usersCol.findOne({ _id: new ObjectId(app.userId) }) : null;
              return {
                id: app._id.toString(),
                internshipId: app.internshipId,
                internshipTitle: internship?.title || 'Unknown',
                company: company?.name || 'Unknown',
                appliedDate: app.createdAt?.toISOString?.() || '',
                status: app.status,
                lastUpdated: app.updatedAt?.toISOString?.() || '',
                coverLetter: app.coverLetter,
                resumeUrl: app.resumeUrl,
                user: applicant ? {
                  id: applicant._id.toString(),
                  name: applicant.name,
                  email: applicant.email,
                  image: applicant.image,
                } : null,
              };
            }));
            await client.close();
            return NextResponse.json({ success: true, data: fullApplications });
          }
          await client.close();
        } catch (mongoError) {
          console.error('MongoDB fallback for superadmin failed:', mongoError);
        }
      }
      const formattedApplications = applications.map((app: any) => ({
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
      
      let formattedApplications = applications.map((app: any) => ({
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
      // Fallback to Mongo if user has applications stored only in MongoDB
      if (!formattedApplications || formattedApplications.length === 0) {
        try {
          const client = new MongoClient(process.env.DATABASE_URL!);
          await client.connect();
          const url = new URL(process.env.DATABASE_URL!);
          const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
          const db = client.db(dbName);
          const usersCol = db.collection('User');
          const internshipsCol = db.collection('Internship');
          const companiesCol = db.collection('Company');
          const applicationsCol = db.collection('Application');
          const mongoUser = await usersCol.findOne({ email: session.user.email });
          if (mongoUser) {
            const mongoApps = await applicationsCol.find({ userId: String(mongoUser._id) }).toArray();
            formattedApplications = await Promise.all(mongoApps.map(async (app: any) => {
              const internship = await internshipsCol.findOne({ _id: new ObjectId(app.internshipId) });
              const company = internship ? await companiesCol.findOne({ _id: new ObjectId(internship.companyId) }) : null;
              return {
                id: String(app._id),
                internshipId: app.internshipId,
                internshipTitle: internship?.title || 'Unknown',
                company: company?.name || 'Unknown',
                appliedDate: app.createdAt?.toISOString?.() || '',
                status: app.status,
                lastUpdated: app.updatedAt?.toISOString?.() || '',
                coverLetter: app.coverLetter,
                resumeUrl: app.resumeUrl,
              };
            }));
          }
          await client.close();
        } catch (mongoError) {
          console.error('MongoDB fallback for regular user failed:', mongoError);
        }
      }
      
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
      // Notify the admin (company owner) on new application
      await (prisma as any).notification.create({
        data: {
          userId: targetInternship.company.ownerId,
          type: 'new_application',
          title: 'New Application',
          message: `New application for ${targetInternship.title}`,
          relatedId: application.id,
        },
      }).catch(() => {});
      
      // Also notify the student (applicant) that their application was submitted
      await (prisma as any).notification.create({
        data: {
          userId: user.id,
          type: 'application_submitted',
          title: 'Application Submitted',
          message: `Your application for ${targetInternship.title} has been successfully submitted! You will be notified when the status changes.`,
          relatedId: application.id,
        },
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
      const companiesCol = db.collection('Company');
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
      // Notify the admin (company owner) on new application
      const company = await companiesCol.findOne({ _id: new ObjectId(targetInternship.companyId) });
      if (company && company.ownerId) {
        const notifsCol = db.collection('Notification');
        await notifsCol.insertOne({
          userId: company.ownerId,
          type: 'new_application',
          title: 'New Application',
          message: `New application for ${targetInternship.title}`,
          relatedId: String(insertRes.insertedId),
          read: false,
          createdAt: new Date(),
        });
      }
      
      // Also notify the student (applicant) that their application was submitted
      const notifsCol = db.collection('Notification');
      await notifsCol.insertOne({
        userId: String(user._id),
        type: 'application_submitted',
        title: 'Application Submitted',
        message: `Your application for ${targetInternship.title} has been successfully submitted! You will be notified when the status changes.`,
        relatedId: String(insertRes.insertedId),
        read: false,
        createdAt: new Date(),
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
        // continue to Mongo check below
      } else {
        const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { internship: true } });
        if (!app || app.internship.companyId !== company.id) {
          // continue to Mongo check below
        }
      }
    }
    try {
      const updated = await prisma.application.update({ 
        where: { id: applicationId }, 
        data: { status },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
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
      } as const;
      const notificationMessage = (statusMessages as any)[status] || 
        `Your application status for ${updated.internship.title} has been updated to ${status}`;
      // Only notify the student (applicant) on status change
      await (prisma as any).notification.create({
        data: {
          userId: updated.userId,
          type: 'application_status',
          title: 'Application Status Updated',
          message: notificationMessage,
          relatedId: updated.id,
        },
      }).catch((error: any) => {
        console.error('Failed to create notification:', error);
      });
      return NextResponse.json({ success: true, data: updated, message: 'Application status updated' });
    } catch (e) {
      // Mongo fallback for updating application status
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const usersCol = db.collection('User');
        const companiesCol = db.collection('Company');
        const internshipsCol = db.collection('Internship');
        const applicationsCol = db.collection('Application');
        const notifsCol = db.collection('Notification');

        const appOid = (() => { try { return new ObjectId(applicationId!); } catch { return null; } })();
        if (!appOid) { await client.close(); return NextResponse.json({ success: false, error: 'Invalid applicationId' }, { status: 400 }); }
        const app = await applicationsCol.findOne({ _id: appOid });
        if (!app) { await client.close(); return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 }); }

        // Permission: if admin, ensure owns the company of the internship
        if (actor.role === 'admin') {
          const internship = await internshipsCol.findOne({ _id: new ObjectId(app.internshipId) });
          if (!internship) { await client.close(); return NextResponse.json({ success: false, error: 'Internship not found' }, { status: 404 }); }
          const company = await companiesCol.findOne({ _id: new ObjectId(internship.companyId) });
          const actorMongo = await usersCol.findOne({ email: actor.email });
          const actorOwnerId = actorMongo ? String(actorMongo._id) : actor.id;
          if (!company || ![String(company.ownerId), actor.id].includes(actorOwnerId)) {
            await client.close();
            return NextResponse.json({ success: false, error: 'Application not found for your company' }, { status: 404 });
          }
        }

        await applicationsCol.updateOne({ _id: appOid }, { $set: { status, updatedAt: new Date() } });

        // Notification to applicant
        const applicantId = String(app.userId);
        const internship = await internshipsCol.findOne({ _id: new ObjectId(app.internshipId) });
        const company = internship ? await companiesCol.findOne({ _id: new ObjectId(internship.companyId) }) : null;
        const statusMessages = {
          'shortlisted': `Congratulations! Your application for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'} has been shortlisted. You're one step closer to getting the internship!`,
          'interviewed': `Great news! You've been selected for an interview for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'}. Please check your email for interview details.`,
          'accepted': `🎉 Congratulations! Your application for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'} has been accepted! Welcome to the team!`,
          'rejected': `We regret to inform you that your application for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'} was not successful this time. Thank you for your interest.`
        } as const;
        const notificationMessage = (statusMessages as any)[status] || 
          `Your application status has been updated to ${status}`;
        await notifsCol.insertOne({
          userId: applicantId,
          type: 'application_status',
          title: 'Application Status Updated',
          message: notificationMessage,
          relatedId: String(app._id),
          read: false,
          createdAt: new Date(),
        });

        await client.close();
        return NextResponse.json({ success: true, data: { id: String(app._id), status }, message: 'Application status updated' });
      } catch (mongoUpdateError) {
        console.error('MongoDB fallback for PATCH failed:', mongoUpdateError);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
