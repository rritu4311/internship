import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/companies - Get all companies with optional filters
export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const industry = searchParams.get('industry') || '';
    const location = searchParams.get('location') || '';

    // Build filter conditions
    const where: any = {};

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
    const formattedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      description: company.description,
      logo: company.logo,
      website: company.website,
      location: company.location,
      industry: company.industry,
      size: company.size,
      internshipCount: company._count.internships,
      isFavorite: false, // This will be handled by user-specific favorite logic
    }));

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
    const body = await request.json();
    const { name, description, logo, website, location, industry, size, ownerId } = body;

    // Validate required fields
    if (!name || !ownerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create company in database
    const company = await prisma.company.create({
      data: {
        name,
        description,
        logo,
        website,
        location,
        industry,
        size,
        ownerId,
      },
    });

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
