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
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      // Create user if they don't exist (for Google OAuth users)
      // Use MongoDB driver directly to avoid replica set requirement
      const client = new MongoClient(process.env.DATABASE_URL!);
      await client.connect();
      
      const db = client.db('onlyinternship_dummy');
      const usersCollection = db.collection('User');
      
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
      user = {
        id: result.insertedId.toString(),
        name: newUserData.name,
        email: newUserData.email,
        image: newUserData.image,
        role: newUserData.role,
        createdAt: newUserData.createdAt,
        updatedAt: newUserData.updatedAt,
        profile: null,
        applications: [],
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        },
        profile: user.profile,
        applications: user.applications || [],
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