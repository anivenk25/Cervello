import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db';
import Source from '@/models/source';
import Query from '@/models/query';

// Verify webhook signature to ensure request is legitimate
function verifyWebhookSignature(request, signature) {
  // In production, implement proper signature verification
  // using crypto and a shared secret with your data sources
  
  // This is a placeholder implementation
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('WEBHOOK_SECRET is not configured');
    return false;
  }
  
  // Simple verification (replace with proper HMAC verification in production)
  return signature === webhookSecret;
}

export async function POST(request) {
  try {
    // Get headers for verification
    const headersList = headers();
    const signature = headersList.get('x-webhook-signature') || '';
    const webhookType = headersList.get('x-webhook-type') || '';
    
    // Parse request body
    const payload = await request.json();
    
    // Verify webhook signature (optional but recommended)
    if (process.env.NODE_ENV === 'production' && !verifyWebhookSignature(request, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Process different webhook types
    switch (webhookType) {
      case 'source.updated':
        await handleSourceUpdate(payload);
        break;
        
      case 'source.created':
        await handleSourceCreate(payload);
        break;
        
      case 'source.deleted':
        await handleSourceDelete(payload);
        break;
        
      case 'query.feedback':
        await handleQueryFeedback(payload);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unsupported webhook type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handler for source update events
async function handleSourceUpdate(payload) {
  const { sourceId, content, metadata = {} } = payload;
  
  if (!sourceId) {
    throw new Error('sourceId is required');
  }
  
  // Update source in database
  await Source.findByIdAndUpdate(
    sourceId,
    {
      $set: {
        content: content,
        metadata: metadata,
        updatedAt: new Date(),
        status: 'outdated', // Mark for reindexing
      }
    },
    { new: true }
  );
  
  // Notify Pathway API to reindex this source (if needed)
  // This could be done via a background job or direct API call
  try {
    await notifyPathwayForReindexing(sourceId);
  } catch (error) {
    console.error('Failed to notify Pathway for reindexing:', error);
    // Continue processing anyway - don't fail the webhook
  }
}

// Handler for source creation events
async function handleSourceCreate(payload) {
  const { title, description, type, url, content, metadata = {}, userId, isPublic = false } = payload;
  
  if (!title || !userId) {
    throw new Error('title and userId are required');
  }
  
  // Create new source in database
  const newSource = await Source.create({
    title,
    description: description || '',
    type: type || 'document',
    url: url || '',
    content: content || '',
    metadata: metadata,
    userId,
    isPublic,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'pending', // New source needs indexing
  });
  
  // Notify Pathway API to index this source
  try {
    await notifyPathwayForIndexing(newSource._id);
  } catch (error) {
    console.error('Failed to notify Pathway for indexing:', error);
    // Continue processing anyway - don't fail the webhook
  }
}

// Handler for source deletion events
async function handleSourceDelete(payload) {
  const { sourceId } = payload;
  
  if (!sourceId) {
    throw new Error('sourceId is required');
  }
  
  // Delete source from database
  await Source.findByIdAndDelete(sourceId);
  
  // Notify Pathway API to remove this source from index
  try {
    await notifyPathwayForDeletion(sourceId);
  } catch (error) {
    console.error('Failed to notify Pathway for deletion:', error);
    // Continue processing anyway - don't fail the webhook
  }
}

// Handler for query feedback events
async function handleQueryFeedback(payload) {
  const { queryId, rating, comment } = payload;
  
  if (!queryId || rating === undefined) {
    throw new Error('queryId and rating are required');
  }
  
  // Update query with feedback
  await Query.findByIdAndUpdate(
    queryId,
    {
      $set: {
        'feedback.rating': rating,
        'feedback.comment': comment || '',
        'feedback.timestamp': new Date(),
      }
    },
    { new: true }
  );
}

// Helper function to notify Pathway for reindexing
async function notifyPathwayForReindexing(sourceId) {
  const apiUrl = process.env.PATHWAY_API_URL || 'http://localhost:8000/api';
  const apiKey = process.env.PATHWAY_API_KEY || '';
  
  const response = await fetch(`${apiUrl}/reindex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
    },
    body: JSON.stringify({
      sourceId,
      action: 'update'
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Pathway API returned ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Helper function to notify Pathway for indexing
async function notifyPathwayForIndexing(sourceId) {
  const apiUrl = process.env.PATHWAY_API_URL || 'http://localhost:8000/api';
  const apiKey = process.env.PATHWAY_API_KEY || '';
  
  const response = await fetch(`${apiUrl}/reindex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
    },
    body: JSON.stringify({
      sourceId,
      action: 'create'
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Pathway API returned ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// Helper function to notify Pathway for deletion
async function notifyPathwayForDeletion(sourceId) {
  const apiUrl = process.env.PATHWAY_API_URL || 'http://localhost:8000/api';
  const apiKey = process.env.PATHWAY_API_KEY || '';
  
  const response = await fetch(`${apiUrl}/reindex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey ? `Bearer ${apiKey}` : '',
    },
    body: JSON.stringify({
      sourceId,
      action: 'delete'
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Pathway API returned ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}