// src/app/api/auth/profile/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/user';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    let user = await User.findById(session.user.id).lean();
    
    // If user doesn't exist in our extended model yet, create a baseline record
    if (!user) {
      const newUser = new User({
        _id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      });
      
      user = await newUser.save();
    }
    
    return Response.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return Response.json({ error: 'Failed to fetch profile data' }, { status: 500 });
  }
}