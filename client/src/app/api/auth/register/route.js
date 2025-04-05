import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/user';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    // Connect to database
    await dbConnect();
    
    // Get request body
    const body = await request.json();
    const { name, email, password } = body;
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 409 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    
    // Return success without exposing password
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}