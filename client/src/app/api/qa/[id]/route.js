// src/app/api/qa/[id]/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

// Define a schema for your queries if you don't have one already
const querySchema = new mongoose.Schema({
  question: String,
  answer: String,
  sources: Array,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Query = mongoose.models.Query || mongoose.model('Query', querySchema);

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid query ID' }, { status: 400 });
    }
    
    const query = await Query.findById(id);
    
    if (!query) {
      return Response.json({ error: 'Query not found' }, { status: 404 });
    }
    
    return Response.json(query);
  } catch (error) {
    console.error('Error fetching query:', error);
    return Response.json({ error: 'Failed to fetch query' }, { status: 500 });
  }
}