import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/user - Get current user data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Try to find user with Prisma first
    let user;
    let prismaUserFound = false;
    try {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          profile: true,
          applications: {
            include: {
              internship: {
                include: {
                  company: {
                    select: { name: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      prismaUserFound = !!user;
      console.log('Prisma user found:', prismaUserFound);
    } catch (prismaError) {
      console.log('Prisma failed, will try MongoDB:', prismaError);
      user = null;
    }

    // Always check MongoDB for applications, even if user exists in Prisma
    // This handles cases where applications are stored in MongoDB but user is in Prisma
    if (user && prismaUserFound) {
      console.log('User found in Prisma, checking MongoDB for additional applications...');
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const applicationsCollection = db.collection('Application');
        const internshipsCollection = db.collection('Internship');
        const companiesCollection = db.collection('Company');
        
        // First try to find applications by user ID
        let mongoApps = await applicationsCollection.find({ userId: user.id }).toArray();
        console.log('MongoDB applications found for user ID:', mongoApps.length);
        
        // If no applications found by user ID, try to find by email
        if (mongoApps.length === 0) {
          const mongoUser = await db.collection('User').findOne({ email: session.user.email });
          if (mongoUser) {
            mongoApps = await applicationsCollection.find({ userId: mongoUser._id.toString() }).toArray();
            console.log('MongoDB applications found for email:', mongoApps.length);
          }
        }
        
        if (mongoApps.length > 0) {
          // Get full application data with internship and company details
          const fullApplications: any[] = await Promise.all(mongoApps.map(async (app: any) => {
            try {
              const internship = await internshipsCollection.findOne({ _id: new ObjectId(app.internshipId) });
              if (internship) {
                const company = await companiesCollection.findOne({ _id: new ObjectId(internship.companyId) });
                return {
                  id: app._id.toString(),
                  internshipId: app.internshipId,
                  internshipTitle: internship.title,
                  company: company?.name || 'Unknown Company',
                  appliedDate: app.createdAt.toISOString(),
                  status: app.status || 'applied',
                  lastUpdated: app.updatedAt.toISOString(),
                  coverLetter: app.coverLetter,
                  resumeUrl: app.resumeUrl,
                };
              }
            } catch (error) {
              console.error('Error processing MongoDB application:', error);
            }
            return null;
          }));
          
          // Merge applications from Prisma and MongoDB
          const existingApps = user.applications || [];
          const mongoAppsFiltered = fullApplications.filter((app: any) => app !== null);
          
          // Create a map to avoid duplicates
          const appMap = new Map();
          existingApps.forEach((app: any) => appMap.set(app.id, app));
          mongoAppsFiltered.forEach((app: any) => appMap.set(app.id, app));
          
          user.applications = Array.from(appMap.values());
          console.log('Merged applications - Prisma:', existingApps.length, 'MongoDB:', mongoAppsFiltered.length, 'Total:', user.applications.length);
        }
        
        await client.close();
      } catch (mongoError) {
        console.error('Error checking MongoDB for applications:', mongoError);
      }
    }

    if (!user) {
      // Create user if they don't exist (for Google OAuth users)
      // Use MongoDB driver directly to avoid replica set requirement
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const usersCollection = db.collection('User');
      const companiesCollection = db.collection('Company');
      const internshipsCollection = db.collection('Internship');
      const applicationsCollection = db.collection('Application');
      
      const newUserData = {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: 'student',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await usersCollection.insertOne(newUserData);
      
      await client.close();
      
      // Create a user object that matches the expected format
      const company = await companiesCollection.findOne({ ownerId: result.insertedId.toString() });
      const internships = company ? await internshipsCollection.find({ companyId: company._id.toString() }).toArray() : [];
      const apps = await applicationsCollection.find({ userId: result.insertedId.toString() }).toArray();
      
      // Get full application data with internship and company details
      const fullApplications = await Promise.all(apps.map(async (app: any) => {
        try {
          const internship = await internshipsCollection.findOne({ _id: new ObjectId(app.internshipId) });
          if (internship) {
            const company = await companiesCollection.findOne({ _id: new ObjectId(internship.companyId) });
            return {
              id: app._id.toString(),
              internshipId: app.internshipId,
              internshipTitle: internship.title,
              company: company?.name || 'Unknown Company',
              appliedDate: app.createdAt.toISOString(),
              status: app.status || 'applied',
              lastUpdated: app.updatedAt.toISOString(),
              coverLetter: app.coverLetter,
              resumeUrl: app.resumeUrl,
            };
          }
        } catch (error) {
          console.error('Error processing application:', error);
        }
        return null;
      }));
      
      console.log('MongoDB applications found:', fullApplications.filter(app => app !== null).length);
      
      user = {
        id: result.insertedId.toString(),
        name: newUserData.name,
        email: newUserData.email,
        image: newUserData.image,
        role: newUserData.role,
        createdAt: newUserData.createdAt,
        updatedAt: newUserData.updatedAt,
        profile: null,
        company: company ? { id: company._id.toString(), ...company } : null,
        applications: fullApplications.filter(app => app !== null),
        internships: internships.map((i: any) => ({ id: i._id.toString(), ...i })),
      } as any;
    }

    const toNullableString = (v: unknown): string | null => (typeof v === 'string' ? v : null);
    const safeName: string | null = toNullableString((user as any)?.name);
    const safeEmail: string | null = toNullableString((user as any)?.email);
    const safeImage: string | null = toNullableString((user as any)?.image);

    // Fetch all companies owned by this user and their internships
    let companies = await prisma.company.findMany({ where: { ownerId: user!.id }, include: { internships: true } });
    // Fallback to Mongo if none (mixed ownerId types)
    if (!companies || companies.length === 0) {
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const companiesCol = db.collection('Company');
        const internshipsCol = db.collection('Internship');
        const mongoCompanies = await companiesCol.find({ ownerId: { $in: [user!.id, (global as any).ObjectId?.(user!.id) ] } as any }).toArray();
        const map = await Promise.all(mongoCompanies.map(async (c: any) => {
          const ints = await internshipsCol.find({ companyId: { $in: [String(c._id)] } }).toArray();
          return { id: String(c._id), name: c.name, description: c.description, location: c.location, industry: c.industry, size: c.size, internships: ints.map((i: any) => ({ id: String(i._id), ...i })) } as any;
        }));
        await client.close();
        companies = map as any;
      } catch {}
    }

    const responseData = {
      user: {
        id: user!.id,
        name: safeName,
        email: safeEmail,
        image: safeImage,
        role: user!.role,
      },
      profile: user!.profile,
      companies,
      internships: companies.flatMap((c) => c.internships),
      applications: user!.applications || [],
    };
    
    console.log('User API response data:', {
      userRole: responseData.user.role,
      applicationsCount: responseData.applications.length,
      companiesCount: responseData.companies.length,
      internshipsCount: responseData.internships.length,
    });
    
    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}