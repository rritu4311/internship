import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Hybrid';
  duration: string;
  stipend: string;
  postedDate: string;
  description: string;
  requirements: string[];
  skills: string[];
  isBookmarked: boolean;
}

// GET /api/internships/[id] - Fetch a specific internship
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Fetch internship from DB
    const internship = await prisma.internship.findUnique({
      where: { id },
      include: { company: { select: { name: true, logo: true } } },
    });
    if (!internship) {
      return NextResponse.json(
        { success: false, error: 'Internship not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: internship,
    });
  } catch (error) {
    console.error('Error fetching internship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch internship' },
      { status: 500 }
    );
  }
}

// PUT /api/internships/[id] - Update a specific internship
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedInternship = await prisma.internship.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({
      success: true,
      data: updatedInternship,
      message: 'Internship updated successfully',
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update internship' },
      { status: 500 }
    );
  }
}

// DELETE /api/internships/[id] - Delete a specific internship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedInternship = await prisma.internship.delete({
      where: { id },
    });
    return NextResponse.json({
      success: true,
      data: deletedInternship,
      message: 'Internship deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting internship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete internship' },
      { status: 500 }
    );
  }
}

// PATCH /api/internships/[id] - Partially update a specific internship
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedInternship = await prisma.internship.update({
      where: { id },
      data: body,
    });
    return NextResponse.json({
      success: true,
      data: updatedInternship,
      message: 'Internship updated successfully',
    });
  } catch (error) {
    console.error('Error updating internship:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update internship' },
      { status: 500 }
    );
  }
}
