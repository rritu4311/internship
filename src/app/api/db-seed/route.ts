import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db-seed';

// POST /api/db-seed - Seed the database with sample data
export async function POST() {
  try {
    console.log('Starting database seeding...');
    
    const result = await seedDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        companiesCreated: result.companies.length,
        internshipsCreated: result.internships.length,
      },
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to seed database', 
        error: String(error) 
      },
      { status: 500 }
    );
  }
}
