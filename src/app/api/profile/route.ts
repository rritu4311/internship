import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/db';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: user.profile,
    });
    
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { bio, phoneNumber, location, skills, education, experience, linkedinProfile, githubProfile, portfolioUrl } = body;
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    let profile;
    
    if (user.profile) {
      // Update existing profile
      profile = await prisma.profile.update({
        where: { userId: user.id },
        data: {
          bio,
          phoneNumber,
          location,
          skills,
          education,
          experience,
          linkedinProfile,
          githubProfile,
          portfolioUrl,
        },
      });
    } else {
      // Create new profile
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          bio,
          phoneNumber,
          location,
          skills,
          education,
          experience,
          linkedinProfile,
          githubProfile,
          portfolioUrl,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
