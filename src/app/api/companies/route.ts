import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient, ObjectId } from 'mongodb';

// GET /api/companies - Get all companies with optional filters
export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const industry = searchParams.get('industry') || '';
    const location = searchParams.get('location') || '';

    // Build filter conditions
    const where: any = {};
    // If admin, restrict to their own company
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (actor?.role === 'admin') {
          where.ownerId = actor.id;
        }
      }
    } catch {}

  if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

  if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Fetch companies from database
    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            internships: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format companies for frontend
    let formattedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      description: company.description,
      logo: company.logo,
      website: company.website,
      location: company.location,
      industry: company.industry,
      size: company.size,
      ownerId: company.ownerId,
      internshipCount: company._count.internships,
      isFavorite: false, // This will be handled by user-specific favorite logic
    }));

    // Fallback to Mongo if admin and no results (mixed ObjectId/string ownerId)
    if ((!formattedCompanies || formattedCompanies.length === 0) && where.ownerId) {
      try {
        const client = new MongoClient(process.env.DATABASE_URL!);
        await client.connect();
        const url = new URL(process.env.DATABASE_URL!);
        const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
        const db = client.db(dbName);
        const companiesCol = db.collection('Company');
        const mongoCompanies = await companiesCol.find({ $or: [ { ownerId: where.ownerId }, { ownerId: new ObjectId(where.ownerId) } ] }).toArray();
        await client.close();
        formattedCompanies = mongoCompanies.map((c: any) => ({
          id: String(c._id),
          name: c.name,
          description: c.description,
          logo: c.logo,
          website: c.website,
          location: c.location,
          industry: c.industry,
          size: c.size,
          ownerId: String(c.ownerId),
          internshipCount: 0,
          isFavorite: false,
        }));
      } catch {}
    }

  return NextResponse.json({
    success: true,
      data: formattedCompanies,
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!actor) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { name, description, logo, website, location, industry, size, ownerId } = body;

    // Validate required fields
    if (!name || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Role enforcement
    if (actor.role === 'admin') {
      // Admin can only create a company for themselves and only one
      const existing = await prisma.company.findFirst({ where: { ownerId: actor.id } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Company already exists for this admin' }, { status: 400 });
      }
      if (ownerId !== actor.id) {
        return NextResponse.json({ success: false, error: 'Admins can only create company for themselves' }, { status: 403 });
      }
    } else if (actor.role === 'superadmin') {
      // Superadmin can create for admins only
      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (!owner || owner.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'ownerId must be an admin user' }, { status: 400 });
      }
      const existing = await prisma.company.findFirst({ where: { ownerId } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Company already exists for this admin' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Create company in database
    let company;
    try {
      company = await prisma.company.create({
        data: { name, description, logo, website, location, industry, size, ownerId },
      });
    } catch (e) {
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      const url = new URL(process.env.DATABASE_URL!);
      const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
      const db = client.db(dbName);
      const companies = db.collection('Company');
      const insert = await companies.insertOne({ name, description, logo, website, location, industry, size, ownerId: new ObjectId(ownerId), createdAt: new Date(), updatedAt: new Date() });
      await client.close();
      company = { id: String(insert.insertedId), name, description, logo, website, location, industry, size, ownerId } as any;
    }

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Company created successfully',
    });

  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
