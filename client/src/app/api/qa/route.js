import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Query from '@/models/query';
import UserPreference from '@/models/userPreference';

// Helper function to fetch data from Pathway API
async function fetchFromPathway(question, userRole) {
  try {
    const apiUrl = process.env.PATHWAY_API_URL || 'http://localhost:8000/api';
    const apiKey = process.env.PATHWAY_API_KEY || '';

    const response = await fetch(`${apiUrl}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey ? `Bearer ${apiKey}` : '',
      },
      body: JSON.stringify({
        query: question,
        userRole: userRole, // Pass user role for personalized responses
        retrievalOptions: {
          topK: 5, // Retrieve top 5 relevant chunks
          threshold: 0.7, // Relevance threshold
        }
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Pathway API returned ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error querying Pathway API:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const { question, context } = await request.json();
    
    // Validate request
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await dbConnect();
    
    // Get user preferences based on their role
    const userPreferences = await UserPreference.findOne({ userId: session.user.id });
    
    // Create query record (save before processing to track all questions)
    const newQuery = await Query.create({
      userId: session.user.id,
      question,
      context: context || '',
      status: 'processing',
      timestamp: new Date(),
    });

    // Start tracking processing time
    const startTime = Date.now();

    try {
      // Call Pathway API for retrieval and generation
      const pathwayResponse = await fetchFromPathway(question, session.user.role);
      
      // Process response
      const { answer, sources } = pathwayResponse;
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Update query with results
      await Query.findByIdAndUpdate(newQuery._id, {
        answer,
        sources,
        status: 'completed',
        processingTime,
      });
      
      // Prepare sources for response
      // Filter sources based on user preferences if they don't want to see sources
      const responseSources = userPreferences?.showSources === false ? [] : sources;
      
      // Return response
      return NextResponse.json({
        id: newQuery._id,
        question,
        answer,
        sources: responseSources,
        processingTime
      });
    } catch (error) {
      // Update query with error status
      await Query.findByIdAndUpdate(newQuery._id, {
        status: 'failed',
        processingTime: Date.now() - startTime,
      });
      
      console.error('Error processing Q&A request:', error);
      
      // Return fallback response or error
      return NextResponse.json(
        { 
          error: 'Failed to process your question. Please try again later.',
          id: newQuery._id,
          question
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('QA API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint to get all queries for the current user
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Connect to database
    await dbConnect();
    
    // Get user's queries
    const queries = await Query.find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude version field
    
    // Get total count
    const total = await Query.countDocuments({ userId: session.user.id });
    
    // Return response
    return NextResponse.json({
      queries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('QA GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}