import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    const formattedInternships = internships.map(internship => ({
        id: internship.id,
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
    const body = await request.json();
    const { title, description, companyId, location, locationType, duration, stipend, skills, responsibilities, qualifications, startDate, applicationDeadline } = body;
    
    // Validate required fields
    if (!title || !description || !companyId || !location || !duration) {
        return NextResponse.json(
        { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
    }

    // Create internship in database
    const internship = await prisma.internship.create({
          data: {
        title,
        description,
        companyId,
        location,
        locationType: locationType || 'onsite',
        duration: parseInt(duration),
        stipend: stipend ? parseInt(stipend) : null,
        skills: skills || [],
        responsibilities: responsibilities || [],
        qualifications: qualifications || [],
        startDate: startDate ? new Date(startDate) : null,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        },
        include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });
      
      return NextResponse.json({
        success: true,
      data: internship,
      message: 'Internship created successfully',
    });

  } catch (error) {
    console.error('Error creating internship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create internship' },
      { status: 500 }
    );
  }
}
