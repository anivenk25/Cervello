'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { use } from 'react';
import AnswerDisplay from '@/components/qa/AnswerDisplay';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function QAThreadPage({ params }) {
  // Use React.use to unwrap params
  const id = use(params).id;
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?returnUrl=/qa');
      return;
    }

    const fetchQuery = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/qa/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to load query');
        }
        
        const data = await response.json();
        setQuery(data);
      } catch (error) {
        console.error('Error fetching query:', error);
        setError(error.message || 'Failed to load query');
      } finally {
        setLoading(false);
      }
    };

    if (id && status === 'authenticated') {
      fetchQuery();
    }
  }, [id, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header user={session?.user} />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header user={session?.user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => router.push('/qa')}
              className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Back to Q&A
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={session?.user} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {query ? (
          <div>
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/[.06] dark:border-white/[.08]">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Question</h2>
              <p className="text-lg">{query.question}</p>
            </div>
            
            <AnswerDisplay 
              answer={query.answer} 
              sources={query.sources || []} 
              isLoading={false} 
              error={null}
              queryId={query._id}
            />
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => router.push('/qa')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Back to Q&A
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No query found</p>
        )}
      </main>
      
      <Footer />
    </div>
  );
}