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
    
    if (!session?.user?.email) {
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

    console.log('Looking up application with ID:', applicationId);
    
    // First try to find in PostgreSQL with the direct ID
    let application = null;
    try {
      console.log('Trying PostgreSQL lookup...');
      application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          internship: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  ownerId: true
                }
              }
            }
          }
        }
      });
      console.log('PostgreSQL result:', application ? 'Found' : 'Not found');
    } catch (error) {
      console.error('Error querying PostgreSQL:', error);
      // Continue to MongoDB fallback
    }

    // If not found in PostgreSQL, try MongoDB
    if (!application) {
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const appsCol = db.collection('Application');
        const usersCol = db.collection('User');
        const internshipsCol = db.collection('Internship');
        const companiesCol = db.collection('Company');

        // Try to convert to ObjectId first, then fallback to string ID
        let app = null;
        try {
          console.log('Trying MongoDB with ObjectId...');
          const appOid = new ObjectId(applicationId);
          console.log('Converted to ObjectId:', appOid);
          app = await appsCol.findOne({ _id: appOid });
          console.log('MongoDB ObjectId lookup result:', app ? 'Found' : 'Not found');
          
          if (!app) {
            console.log('Trying MongoDB with string ID...');
            app = await appsCol.findOne({ id: applicationId });
            console.log('MongoDB string ID lookup result:', app ? 'Found' : 'Not found');
            
            if (!app) {
              // Try one more time with direct string match on id field
              console.log('Trying direct string match on id field...');
              try {
                app = await appsCol.findOne({ id: applicationId });
                console.log('MongoDB id field lookup result:', app ? 'Found' : 'Not found');
                
                // If still not found, try to find any matching application
                if (!app) {
                  console.log('Trying to find any matching application...');
                  const allApps = await appsCol.find({}).toArray();
                  console.log(`Found ${allApps.length} applications in database`);
                  
                  // Log first few apps for debugging
                  allApps.slice(0, 3).forEach((a, i) => {
                    console.log(`App ${i + 1}:`, {
                      _id: a._id?.toString(),
                      id: a.id,
                      userId: a.userId,
                      internshipId: a.internshipId
                    });
                  });
                  
                  // Try to find by any field that might match
                  app = allApps.find(a => 
                    a.id === applicationId || 
                    a._id?.toString() === applicationId ||
                    a.userId === applicationId ||
                    a.internshipId === applicationId
                  );
                  
                  console.log('Found match in memory:', app ? 'Yes' : 'No');
                }
              } catch (e) {
                console.error('Error in direct id field match:', e);
              }
            }
          }
        } catch (e) {
          console.error('Error in MongoDB lookup:', e);
          // Try one last time with string ID
          console.log('Fallback to string ID after error...');
          app = await appsCol.findOne({ id: applicationId });
          console.log('Final fallback lookup result:', app ? 'Found' : 'Not found');
        }

        if (!app) { 
          // Before giving up, try one more direct query to see all applications
          console.log('Checking all applications in the database...');
          const allApps = await appsCol.find({}).toArray();
          console.log('All application IDs in database:', allApps.map(a => ({
            _id: a._id?.toString(),
            id: a.id,
            userId: a.userId,
            internshipId: a.internshipId
          })));
          
          await client.close(); 
          return NextResponse.json({ 
            success: false, 
            error: 'Application not found',
            details: {
              message: `No application found with ID: ${applicationId}`,
              triedAsObjectId: true,
              triedAsString: true,
              databaseCount: allApps.length,
              sampleIds: allApps.slice(0, 3).map(a => a._id?.toString())
            }
          }, { status: 404 }); 
        }

        // Permission check for MongoDB
        const userRole = (session.user as any)?.role || '';
        const isAdmin = userRole === 'admin' || userRole === 'superadmin';
        const currentMongoUser = await usersCol.findOne({ email: session.user.email });
        const isOwner = currentMongoUser && (
          String(currentMongoUser._id) === String(app.userId) ||
          currentMongoUser.email === session.user.email
        );

        console.log('MongoDB Permission check:', {
          userEmail: session.user.email,
          userRole,
          isAdmin,
          isOwner,
          appUserId: app.userId,
          mongoUserId: currentMongoUser?._id?.toString()
        });

        if (!isAdmin && !isOwner) { 
          await client.close(); 
          return NextResponse.json(
            { 
              success: false, 
              error: 'Unauthorized to view this application',
              details: {
                message: 'You do not have permission to view this application',
                requiredRole: 'admin, superadmin, or application owner',
                userRole,
                isAdmin,
                isOwner,
                applicationId: app._id?.toString(),
                userId: currentMongoUser?._id?.toString(),
                userEmail: session.user.email
              }
            }, 
            { status: 403 } 
          ); 
        }

        // Join data
        const internship = await internshipsCol.findOne({ _id: new ObjectId(String(app.internshipId)) });
        const company = internship ? await companiesCol.findOne({ _id: new ObjectId(String(internship.companyId)) }) : null;
        const applicant = await usersCol.findOne({ _id: new ObjectId(String(app.userId)) });

        const responseData = {
          id: String(app._id),
          internshipId: String(app.internshipId),
          internshipTitle: internship?.title || 'Unknown',
          company: company?.name || 'Unknown',
          appliedDate: app.createdAt?.toISOString?.() || new Date().toISOString(),
          status: app.status || 'applied',
          lastUpdated: app.updatedAt?.toISOString?.() || new Date().toISOString(),
          coverLetter: app.coverLetter || '',
          resumeUrl: app.resumeUrl || '',
          user: applicant ? { id: String(applicant._id), name: applicant.name, email: applicant.email, image: applicant.image } : { id: '', name: '', email: '' }
        };
        await client.close();
        return NextResponse.json({ success: true, data: responseData });
      } catch (mongoErr) {
        console.error('Mongo GET fallback failed:', mongoErr);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
      }
    }

    // Check if user has permission to view this application
    const userRole = (session.user as any)?.role || '';
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const isOwner = application.userId === session.user.id || 
                   application.user?.id === session.user.id ||
                   application.user?.email === session.user.email;
    
    console.log('Permission check:', {
      userEmail: session.user.email,
      userRole,
      isAdmin,
      isOwner,
      applicationUserId: application.userId || application.user?.id,
      applicationUserEmail: application.user?.email
    });
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized to view this application',
          details: {
            message: 'You do not have permission to view this application',
            requiredRole: 'admin, superadmin, or application owner',
            userRole,
            isAdmin,
            isOwner,
            applicationId: application.id,
            userId: session.user.id,
            userEmail: session.user.email
          }
        },
        { status: 403 }
      );
    }

    // Format the response
    const responseData = {
      id: application.id,
      internshipId: application.internshipId,
      internshipTitle: application.internship.title,
      company: application.internship.company.name,
      appliedDate: application.createdAt.toISOString(),
      status: application.status,
      lastUpdated: application.updatedAt.toISOString(),
      coverLetter: application.coverLetter,
      resumeUrl: application.resumeUrl,
      user: {
        id: application.user.id,
        name: application.user.name,
        email: application.user.email,
        image: application.user.image
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('Error in GET /api/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/applications/[id] - Update application status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
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

    // Parse request body
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['applied', 'shortlisted', 'interviewed', 'accepted', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Find the application with company ID for permission check
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        internship: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this application
    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    const isAdmin = actor?.role === 'admin' || actor?.role === 'superadmin';
    let ownsCompany = false;
    if (actor?.role === 'admin') {
      const adminCompany = await prisma.company.findFirst({ where: { ownerId: actor.id } });
      ownsCompany = !!adminCompany && adminCompany.id === application.internship.company.id;
    }
    if (!isAdmin && !ownsCompany) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this application' },
        { status: 403 }
      );
    }

    // Update the application status
    try {
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          internship: {
            select: {
              title: true
            }
          }
        }
      });

      // Create a notification for the applicant
      const notificationMessage = `Your application for ${application.internship.title} at ${application.internship.company.name} has been ${newStatus}.`;
      
      await (prisma as any).notification.create({
        data: {
          userId: application.userId,
          type: 'application_status',
          title: 'Application Status Update',
          message: notificationMessage,
          relatedId: applicationId,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        data: {
          id: updatedApplication.id,
          status: updatedApplication.status,
          lastUpdated: updatedApplication.updatedAt.toISOString()
        }
      });
    } catch (prismaUpdateErr) {
      // Mongo fallback for update
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const usersCol = db.collection('User');
        const companiesCol = db.collection('Company');
        const internshipsCol = db.collection('Internship');
        const appsCol = db.collection('Application');
        const notifsCol = db.collection('Notification');

        const appOid = (() => { try { return new ObjectId(applicationId); } catch { return null; } })();
        if (!appOid) { await client.close(); return NextResponse.json({ success: false, error: 'Invalid application id' }, { status: 400 }); }
        const app = await appsCol.findOne({ _id: appOid });
        if (!app) { await client.close(); return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 }); }

        // Permission: admin must own the company
        const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
        const actorMongo = await usersCol.findOne({ email: session.user.email });
        const actorOwnerId = actorMongo ? String(actorMongo._id) : actor?.id;
        const internship = await internshipsCol.findOne({ _id: new ObjectId(String(app.internshipId)) });
        const company = internship ? await companiesCol.findOne({ _id: new ObjectId(String(internship.companyId)) }) : null;
        const isAdmin = actor?.role === 'admin' || actor?.role === 'superadmin';
        const ownsCompany = actor?.role === 'admin' ? (company && (String(company.ownerId) === actorOwnerId)) : false;
        if (!isAdmin && !ownsCompany) { await client.close(); return NextResponse.json({ success: false, error: 'Unauthorized to update this application' }, { status: 403 }); }

        await appsCol.updateOne({ _id: appOid }, { $set: { status: newStatus, updatedAt: new Date() } });

        // Notify applicant
        const statusMessages: Record<string, string> = {
          shortlisted: `Congratulations! Your application for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'} has been shortlisted.`,
          interviewed: `You've been selected for an interview for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'}.`,
          accepted: `🎉 Your application for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'} has been accepted!`,
          rejected: `Your application for ${internship?.title ?? 'the internship'} at ${company?.name ?? 'the company'} was not successful this time.`
        };
        const notificationMessage = statusMessages[newStatus] || `Your application status has been updated to ${newStatus}`;
        await notifsCol.insertOne({ userId: String(app.userId), type: 'application_status', message: notificationMessage, read: false, createdAt: new Date() });

        await client.close();
        return NextResponse.json({ success: true, data: { id: String(app._id), status: newStatus, lastUpdated: new Date().toISOString() } });
      } catch (mongoUpdateErr) {
        console.error('Mongo PUT fallback failed:', mongoUpdateErr);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
      }
    }
    
  } catch (error) {
    console.error('Error in PUT /api/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] - Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
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

    // First try to find the application in PostgreSQL
    let application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        internship: {
          include: {
            company: { select: { id: true, ownerId: true } }
          }
        }
      }
    });

    // If not found in PostgreSQL, try MongoDB
    if (!application) {
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const db = client.db();
        
        const appFromMongo = await db.collection('Application').findOne({
          _id: new ObjectId(applicationId)
        });
        
        if (!appFromMongo) {
          return NextResponse.json(
            { success: false, error: 'Application not found' },
            { status: 404 }
          );
        }
        
        // Transform MongoDB document to match Prisma model structure
        const transformedApp = {
          ...appFromMongo,
          id: appFromMongo._id.toString(),
          userId: appFromMongo.userId.toString(),
          internshipId: appFromMongo.internshipId.toString(),
          status: appFromMongo.status || 'applied',
          title: appFromMongo.title || 'Internship Application',
          companyId: appFromMongo.companyId?.toString() || '',
          createdAt: appFromMongo.createdAt || new Date(),
          updatedAt: appFromMongo.updatedAt || new Date(),
          user: { 
            id: appFromMongo.userId.toString(),
            email: session.user.email,
            name: session.user.name || ''
          },
          internship: {
            id: appFromMongo.internshipId.toString(),
            title: appFromMongo.internship?.title || 'Internship',
            company: {
              id: appFromMongo.internship?.companyId?.toString() || '',
              ownerId: session.user.id // Fallback to current user for permission check
            }
          }
        };
        
        // Type assertion to match the expected type
        application = transformedApp as any;
      } catch (mongoError) {
        console.error('MongoDB fallback error:', mongoError);
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }
    }

    // Check if user has permission to withdraw this application
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get the current user from the database to ensure we have the correct ID
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    const isAdmin = session.user.role === 'admin' || session.user.role === 'superadmin';
    const isCompanyOwner = application.internship?.company?.ownerId === currentUser.id;
    const isApplicant = application.user.id === currentUser.id;
    
    console.log('Permission check:', {
      currentUserId: currentUser.id,
      applicantId: application.user.id,
      companyOwnerId: application.internship?.company?.ownerId,
      isAdmin,
      isCompanyOwner,
      isApplicant
    });
    
    if (!isAdmin && !isCompanyOwner && !isApplicant) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to withdraw this application' },
        { status: 403 }
      );
    }

    // Delete related notifications first
    // We'll use a raw MongoDB query since the Prisma schema doesn't expose relatedId in the where clause
    try {
      await prisma.$runCommandRaw({
        delete: 'Notification',
        deletes: [
          {
            q: {
              type: 'application_status',
              relatedId: { $oid: applicationId }
            },
            limit: 0 // 0 means delete all matching documents
          }
        ]
      });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      // Continue with application deletion even if notification deletion fails
    }

    // Update application status to 'withdrawn' in PostgreSQL
    try {
      await prisma.application.update({
        where: { id: applicationId },
        data: { 
          status: 'withdrawn',
          updatedAt: new Date()
        }
      });
    } catch (prismaError) {
      console.log('PostgreSQL update failed, trying MongoDB...');
      
      // Fallback to MongoDB if PostgreSQL update fails
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const db = client.db();
        
        await db.collection('Application').updateOne(
          { _id: new ObjectId(applicationId) },
          { 
            $set: { 
              status: 'withdrawn',
              updatedAt: new Date() 
            } 
          }
        );
        
        await client.close();
      } catch (mongoError) {
        console.error('MongoDB update failed:', mongoError);
        throw new Error('Failed to update application status');
      }
    }

    // Create a notification for the company
    try {
      await prisma.notification.create({
        data: {
          userId: application.internship.company.ownerId,
          type: 'application_status',
          title: 'Application Withdrawn',
          message: `The application from ${application.user?.name || 'an applicant'} for ${application.internship?.title || 'an internship'} has been withdrawn.`,
          relatedId: applicationId,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      });
    } catch (error) {
      console.error('Error creating withdrawal notification:', error);
      // Continue even if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: {
        id: applicationId,
        status: 'withdrawn'
      }
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/applications/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
