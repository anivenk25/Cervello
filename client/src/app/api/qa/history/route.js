import { NextResponse } from 'next/server';

export async function GET(request) {
  // Example mock response
  const history = [
    { id: 1, question: 'What is Pathway?', answer: 'A streaming data engine.' },
    { id: 2, question: 'How does RAG work?', answer: 'By combining retrieval and generation.' },
  ];

  return NextResponse.json(history);
}
