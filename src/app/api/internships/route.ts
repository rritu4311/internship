import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/internships - Get all internships with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const type = searchParams.get('type') || '';
    const companyId = searchParams.get('companyId');

    // Build filter conditions
    const where: any = {
      status: 'open', // Only show open internships
    };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
      
      if (location) {
        where.location = { contains: location, mode: 'insensitive' };
      }
      
      if (type) {
      where.locationType = type;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    // Role-based access control
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const actor = await prisma.user.findUnique({ 
          where: { email: session.user.email },
          include: {
            company: true  // Include the company relation
          }
        });
        
        // Superadmin can see all internships
        if (actor?.role === 'superadmin') {
          // No restrictions - can see all internships
        } 
        // Admin and company users can only see their own company's internships
        else if ((actor?.role === 'admin' || actor?.role === 'company') && actor.company) {
          // Get the company where user is the owner
          const company = await prisma.company.findUnique({
            where: { id: actor.company.id }
          });
          
          if (company) {
            if (where.companyId) {
              // If specific companyId provided, ensure it matches the user's company
              if (where.companyId !== company.id) {
                // If not, restrict to their company
                where.companyId = company.id;
              }
            } else {
              // No specific companyId provided, show only their company
              where.companyId = company.id;
            }
          } else {
            // No company found for this user, return empty result
            where.companyId = 'non-existent-id';
          }
        } else if (actor?.role === 'admin' || actor?.role === 'company') {
          // User has admin/company role but no associated company
          where.companyId = 'non-existent-id';
        }
      }
    } catch (error) {
      console.error('Error in role-based access control:', error);
      // In case of error, be safe and return no results
      where.companyId = 'non-existent-id';
    }

    // Fetch internships from database
    const internships = await prisma.internship.findMany({
        where,
        include: {
          company: {
            select: {
              name: true,
              logo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format internships for frontend
    let formattedInternships = internships.map((internship: any) => ({
        id: internship.id,
        companyId: internship.companyId,
        title: internship.title,
        company: internship.company.name,
      companyLogo: internship.company.logo,
        location: internship.location,
      type: internship.locationType,
        duration: `${internship.duration} weeks`,
      stipend: internship.stipend ? `$${internship.stipend}/month` : 'Unpaid',
      postedDate: internship.createdAt.toISOString(),
      description: internship.description,
      requirements: internship.qualifications,
        skills: internship.skills,
      isBookmarked: false, // This will be handled by user-specific bookmark logic
    }));

    // Fallback to Mongo if admin restriction applied and prisma returns none
    if ((!formattedInternships || formattedInternships.length === 0) && where.companyId) {
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const internshipsCol = db.collection('Internship');
        const mongoInternships = await internshipsCol.find({ companyId: { $in: [String(where.companyId), new ObjectId(where.companyId)] } }).toArray();
        await client.close();
        formattedInternships = mongoInternships.map((i: any) => ({
          id: String(i._id),
          companyId: String(i.companyId),
          title: i.title,
          company: '',
          companyLogo: '',
          location: i.location,
          type: i.locationType,
          duration: `${i.duration} weeks`,
          stipend: i.stipend ? `$${i.stipend}/month` : 'Unpaid',
          postedDate: (i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString()),
          description: i.description,
          requirements: i.qualifications || [],
          skills: i.skills || [],
          isBookmarked: false,
        }));
      } catch {}
    }
      
      return NextResponse.json({
        success: true,
      data: formattedInternships,
    });

  } catch (error) {
    console.error('Error fetching internships:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch internships' },
      { status: 500 }
    );
  }
}

// POST /api/internships - Create new internship
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!actor) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { title, description, companyId, location, locationType, duration, stipend, skills, responsibilities, qualifications, startDate, applicationDeadline } = body;
    
    // Validate required fields
    if (!title || !description || !companyId || !location || !duration) {
        return NextResponse.json(
        { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
    }

    // Role enforcement: admin can only post for their companies
    if (actor.role === 'admin') {
      const companies = await prisma.company.findMany({ where: { ownerId: actor.id } });
      const adminCompanyIds = companies.map((c: { id: string }) => c.id);
      if (!adminCompanyIds.includes(companyId)) {
        return NextResponse.json({ success: false, error: 'Admins can only post for their own companies' }, { status: 403 });
      }
    } else if (actor.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Create internship in database (Prisma first, then Mongo fallback)
    try {
      // Optional existence check for company in Prisma
      const companyCheck = await prisma.company.findUnique({ where: { id: companyId } });
      if (!companyCheck) {
        // Try Mongo to see if company exists with ObjectId
        try {
          const client = new MongoClient(process.env.DATABASE_URL!);
          await client.connect();
          const url = new URL(process.env.DATABASE_URL!);
          const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
          const db = client.db(dbName);
          const companiesCol = db.collection('Company');
          const maybeCompany = await companiesCol.findOne({ _id: new ObjectId(companyId) });
          await client.close();
          if (!maybeCompany) {
            return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
          }
        } catch (cmpErr) {
          console.error('Company existence check error:', cmpErr);
        }
      }

      const internship = await prisma.internship.create({
        data: {
          title,
          description,
          companyId,
          location,
          locationType: locationType || 'onsite',
          duration: Number(duration),
          stipend: stipend !== null && stipend !== undefined && stipend !== '' ? Number(stipend) : null,
          skills: Array.isArray(skills) ? skills : (skills ? skills : []),
          responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
          qualifications: Array.isArray(qualifications) ? qualifications : [],
          startDate: startDate ? new Date(startDate) : null,
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        },
        include: {
          company: {
            select: { name: true },
          },
        },
      });

      return NextResponse.json({ success: true, data: internship, message: 'Internship created successfully' });
    } catch (prismaCreateErr) {
      console.error('Prisma create internship failed:', prismaCreateErr);
      // Mongo fallback
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const internshipsCol = db.collection('Internship');
        const doc = {
          title,
          description,
          companyId: new ObjectId(companyId),
          location,
          locationType: locationType || 'onsite',
          duration: Number(duration),
          stipend: stipend !== null && stipend !== undefined && stipend !== '' ? Number(stipend) : null,
          skills: Array.isArray(skills) ? skills : (skills ? skills : []),
          responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
          qualifications: Array.isArray(qualifications) ? qualifications : [],
          startDate: startDate ? new Date(startDate) : null,
          applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const insert = await internshipsCol.insertOne(doc);
        await client.close();
        return NextResponse.json({
          success: true,
          data: { id: String(insert.insertedId), ...doc },
          message: 'Internship created successfully (Mongo)'
        });
      } catch (mongoCreateErr) {
        console.error('Mongo create internship failed:', mongoCreateErr);
        return NextResponse.json({ success: false, error: 'Failed to create internship' }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error creating internship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create internship' },
      { status: 500 }
    );
  }
}
