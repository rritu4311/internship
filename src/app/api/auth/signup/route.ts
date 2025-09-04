import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// POST /api/auth/signup - Create new user account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    
    const db = client.db('onlyinternship_dummy');
    const usersCollection = db.collection('User');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData = {
      name,
      email,
      role,
      password: hashedPassword, // Store hashed password
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(userData);
    await client.close();

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.insertedId.toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
      },
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
