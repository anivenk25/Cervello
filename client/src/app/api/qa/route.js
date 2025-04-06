import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Query from '@/models/query';
import UserPreference from '@/models/userPreference';

// Helper function to fetch answer from local LLM
async function fetchFromOpenAI(question, userRole, userId, timestamp) {
  try {
    // Include userId and timestamp in the request to the LLM
    const fullPrompt = `${question}`;
    
    const res = await fetch('http://127.0.0.1:8000/llm-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: fullPrompt,
        metadata: {
          userId: userId,
          timestamp: timestamp.toISOString(),
          userRole: userRole || 'user'
        }
      }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!res.ok) {
      throw new Error(`Local LLM API error: ${res.statusText}`);
    }

    const data = await res.json();
    const answer = data.response || 'No response received.';

    return {
      answer,
      sources: data.sources || [], // Include sources if available from LLM
    };
  } catch (error) {
    console.error('Local LLM API error:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question, context } = await request.json();

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    await dbConnect();

    // Get user preferences
    const userPreferences = await UserPreference.findOne({ userId: session.user.id });
    
    // Create conversation ID for threading if not provided
    // This helps group related queries
    const sessionId = new Date().toISOString().split('T')[0]; // Use date as session ID
    const timestamp = new Date();
    
    // Create initial query entry in database
    const newQuery = new Query({
      userId: session.user.id,
      sessionId: sessionId,
      question,
      context: context || '',
      status: 'processing',
      timestamp: timestamp,
      metadata: {
        clientInfo: {
          browser: request.headers.get('user-agent') || '',
          device: '', // Could be determined from user-agent
          os: ''     // Could be determined from user-agent
        },
        ipAddress: request.headers.get('x-forwarded-for') || ''
      }
    });
    
    // Save to database
    await newQuery.save();

    const startTime = Date.now();

    try {
      // Get response from LLM with userId and timestamp
      const openAIResponse = await fetchFromOpenAI(
        question, 
        session.user.role,
        session.user.id,
        timestamp
      );
      const { answer, sources } = openAIResponse;
      
      const processingTime = Date.now() - startTime;

      // Update the query with the answer
      await Query.findByIdAndUpdate(newQuery._id, {
        answer,
        sources,
        status: 'completed',
        processingTime,
      });

      // Respect user preference to show/hide sources
      const responseSources = userPreferences?.showSources === false ? [] : sources;

      // Return the result to the client
      return NextResponse.json({
        id: newQuery._id,
        question,
        answer,
        sources: responseSources,
        processingTime,
        savedToHistory: true, // Confirm to client that history was saved
      });
    } catch (error) {
      console.error('Error processing query:', error);
      
      // Update query status to failed
      await Query.findByIdAndUpdate(newQuery._id, {
        status: 'failed',
        processingTime: Date.now() - startTime,
        // Store the error message for debugging
        error: error.message || 'Unknown error occurred'
      });

      return NextResponse.json(
        {
          error: 'Failed to process your question. Please try again later.',
          id: newQuery._id,
          question,
          savedToHistory: true // Still saved to history, but as failed
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('QA API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const sessionId = searchParams.get('sessionId'); // Optional filter by session
    const skip = (page - 1) * limit;

    await dbConnect();

    // Build query
    const queryFilter = { userId: session.user.id };
    
    // Add session filter if provided
    if (sessionId) {
      queryFilter.sessionId = sessionId;
    }

    // Get user queries with pagination
    const queries = await Query.find(queryFilter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude versioning field

    // Get total count for pagination
    const total = await Query.countDocuments(queryFilter);

    // Return queries with pagination info
    return NextResponse.json({
      queries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('QA GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}