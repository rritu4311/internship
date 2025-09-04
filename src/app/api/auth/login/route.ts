import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// POST /api/auth/login - Authenticate user with email/password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    
    const url = new URL(process.env.DATABASE_URL!);
    const dbName = (url.pathname || '').replace(/^\//, '') || 'onlyinternship';
    const db = client.db(dbName);
    const usersCollection = db.collection('User');

    // Find user by email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user has a password (not just OAuth)
    if (!user.password) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'This account was created with Google. Please use Google Sign-In.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await client.close();

    // Return success - the frontend will handle NextAuth signIn
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
