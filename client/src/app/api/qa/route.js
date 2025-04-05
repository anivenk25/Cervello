import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Query from '@/models/query';
import UserPreference from '@/models/userPreference';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to fetch answer from OpenAI
async function fetchFromOpenAI(question, userRole) {
  try {
    const systemPrompt = `You are a helpful assistant. Answer as if the user is a ${userRole}.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // or 'gpt-4' if available and desired
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
    });

    const answer = response.choices[0].message.content || 'No response received.';

    return {
      answer,
      sources: [], // Optional: include sources if you do RAG
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
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

    const userPreferences = await UserPreference.findOne({ userId: session.user.id });

    const newQuery = await Query.create({
      userId: session.user.id,
      question,
      context: context || '',
      status: 'processing',
      timestamp: new Date(),
    });

    const startTime = Date.now();

    try {
      const openAIResponse = await fetchFromOpenAI(question, session.user.role);

      const { answer, sources } = openAIResponse;
      const processingTime = Date.now() - startTime;

      await Query.findByIdAndUpdate(newQuery._id, {
        answer,
        sources,
        status: 'completed',
        processingTime,
      });

      const responseSources = userPreferences?.showSources === false ? [] : sources;

      return NextResponse.json({
        id: newQuery._id,
        question,
        answer,
        sources: responseSources,
        processingTime,
      });
    } catch (error) {
      await Query.findByIdAndUpdate(newQuery._id, {
        status: 'failed',
        processingTime: Date.now() - startTime,
      });

      return NextResponse.json(
        {
          error: 'Failed to process your question. Please try again later.',
          id: newQuery._id,
          question,
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
    const skip = (page - 1) * limit;

    await dbConnect();

    const queries = await Query.find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Query.countDocuments({ userId: session.user.id });

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
