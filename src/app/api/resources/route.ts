import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/resources - Get resources data
export async function GET(request: NextRequest) {
  try {
    const resources = await prisma.resource.findMany();
    return NextResponse.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
