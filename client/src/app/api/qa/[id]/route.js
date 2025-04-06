// src/app/api/qa/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Query from '@/models/query';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    
    const query = await Query.findById(id);
    
    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }
    
    // Check if this query belongs to the current user
    if (query.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to access this query' }, { status: 403 });
    }
    
    return NextResponse.json(query);
  } catch (error) {
    console.error('Error fetching query:', error);
    return NextResponse.json({ error: 'Failed to fetch query' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    
    const query = await Query.findById(id);
    
    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }
    
    // Check if this query belongs to the current user
    if (query.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to modify this query' }, { status: 403 });
    }
    
    // Update feedback
    if (body.feedback) {
      query.feedback = {
        rating: body.feedback.rating,
        comment: body.feedback.comment,
        timestamp: new Date()
      };
    }
    
    // Update other fields if needed
    if (body.tags) {
      query.tags = body.tags;
    }
    
    await query.save();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Query updated successfully',
      query: {
        id: query._id,
        question: query.question,
        answer: query.answer,
        feedback: query.feedback
      }
    });
  } catch (error) {
    console.error('Error updating query:', error);
    return NextResponse.json({ error: 'Failed to update query' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const { id } = params;
    
    const query = await Query.findById(id);
    
    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }
    
    // Check if this query belongs to the current user
    if (query.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this query' }, { status: 403 });
    }
    
    await Query.findByIdAndDelete(id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Query deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting query:', error);
    return NextResponse.json({ error: 'Failed to delete query' }, { status: 500 });
  }
}