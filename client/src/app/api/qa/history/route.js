// src/app/api/qa/history/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Query from '@/models/query';

export async function GET(request) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sessionId = searchParams.get('sessionId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Build query filter
    const queryFilter = { userId: session.user.id };
    
    // Add optional filters
    if (sessionId) {
      queryFilter.sessionId = sessionId;
    }
    
    // Add date range filter if provided
    if (dateFrom || dateTo) {
      queryFilter.timestamp = {};
      if (dateFrom) {
        queryFilter.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        queryFilter.timestamp.$lte = new Date(dateTo);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Fetch queries from database
    const queries = await Query.find(queryFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('question answer timestamp status feedback sources sessionId');
    
    // Get total count for pagination
    const total = await Query.countDocuments(queryFilter);

    // Return history with pagination info
    return NextResponse.json({
      history: queries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// Add endpoint to delete all history for a user
export async function DELETE(request) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    // Connect to database
    await dbConnect();
    
    // Build delete filter
    const deleteFilter = { userId: session.user.id };
    
    // If sessionId is provided, only delete that session
    if (sessionId) {
      deleteFilter.sessionId = sessionId;
    }
    
    // Delete matching queries
    const result = await Query.deleteMany(deleteFilter);
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} queries from history`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting history:', error);
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
  }
}