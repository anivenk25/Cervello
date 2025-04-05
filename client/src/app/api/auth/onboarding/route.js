import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/user';
import UserPreference from '@/models/userPreference';

export async function POST(request) {
  try {
    // Get authentication session
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const { role } = await request.json();
    
    // Validate role
    if (!role || !['developer', 'teacher'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Update user with role
    await User.findByIdAndUpdate(
      session.user.id,
      { role },
      { new: true }
    );
    
    // Create user preferences based on role
    let defaultPreferences = {
      userId: session.user.id,
      theme: 'system',
      notifications: true,
    };
    
    // Add role-specific preferences
    if (role === 'developer') {
      defaultPreferences.codeSnippets = true;
      defaultPreferences.technicalTerms = true;
    } else if (role === 'teacher') {
      defaultPreferences.simplifiedExplanations = true;
      defaultPreferences.educationalResources = true;
    }
    
    // Create or update preferences
    await UserPreference.findOneAndUpdate(
      { userId: session.user.id },
      defaultPreferences,
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}