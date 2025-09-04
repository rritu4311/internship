import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MongoClient } from 'mongodb';

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
    let user = await prisma.user.findUnique({
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
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await usersCollection.insertOne(newUserData);
      
      await client.close();
      
      // Create a user object that matches the expected format
      const company = await companiesCollection.findOne({ ownerId: result.insertedId.toString() });
      const internships = company ? await internshipsCollection.find({ companyId: company._id.toString() }).toArray() : [];
      const apps = await applicationsCollection.find({ userId: result.insertedId.toString() }).toArray();
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
        applications: apps.map((a: any) => ({ id: a._id.toString(), internshipId: a.internshipId, status: a.status, createdAt: a.createdAt, updatedAt: a.updatedAt })),
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

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}