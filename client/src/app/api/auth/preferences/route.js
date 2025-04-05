// src/app/api/auth/preferences/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { User } from '@/models/user';
import dbConnect from '@/lib/db';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    await dbConnect();
    
    const user = await User.findById(session.user.id).select('preferences');
    
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    return Response.json(user.preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    await dbConnect();
    
    const preferences = await req.json();
    
    // Update only preferences field
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { preferences } },
      { new: true, upsert: true }
    );
    
    return Response.json(user.preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}