'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import QueryForm from '@/components/qa/QueryForm';
import AnswerDisplay from '@/components/qa/AnswerDisplay';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function QAThreadPage({ params }) {
  const { id } = params;
  const [query, setQuery] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  
  // Fetch the specific query by ID
  useEffect(() => {
    const fetchQuery = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        const response = await fetch(`/api/qa/${id}`);
        
        if (response.ok) {
          const data = await response.json();
          setQuery(data);
        } else {
          throw new Error('Failed to load query');
        }
      } catch (error) {
        console.error('Error fetching query:', error);
        setError(error.message || 'Failed to load this query. It may not exist or you may not have permission to view it.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuery();
  }, [id, isAuthenticated]);
  
  // Fetch user's query history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch('/api/qa?limit=10');
        if (response.ok) {
          const data = await response.json();
          setHistory(data.queries || []);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };
    
    fetchHistory();
  }, [isAuthenticated]);
  
  // Handle form submission for follow-up questions
  const handleSubmit = async (questionText) => {
    if (!questionText.trim() || isLoading) return;
    
    try {
      // Create a new question related to this thread
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question: questionText,
          context: query?.question, // Pass the original question as context
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      const data = await response.json();
      
      // Navigate to the new query
      router.push(`/qa/${data.id}`);
    } catch (error) {
      console.error('Error submitting question:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    }
  };
  
  // Handle history item click
  const handleHistoryItemClick = (item) => {
    router.push(`/qa/${item._id}`);
  };
  
  // Render loading state
  if (loading || (isLoading && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }
  
  // Require authentication
  if (!loading && !isAuthenticated) {
    router.push(`/auth/login?callbackUrl=/qa/${id}`);
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        activeId={id}
        onHistoryItemClick={handleHistoryItemClick}
        className="hidden md:block md:w-64 lg:w-80"
      />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          user={user} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        <main className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            {/* Error message */}
            {error && !isLoading && (
              <div className="p-4 mb-6 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl">
                <h3 className="font-bold mb-2">Error</h3>
                <p>{error}</p>
                <button 
                  onClick={() => router.push('/qa')}
                  className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Back to Q&A
                </button>
              </div>
            )}
            
            {/* Question & Answer display */}
            {query && (
              <div className="mb-8">
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/[.06] dark:border-white/[.08]">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Question</h2>
                  <p className="text-lg">{query.question}</p>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Asked {new Date(query.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <AnswerDisplay 
                  answer={query.answer} 
                  sources={query.sources} 
                  isLoading={false} 
                  error={query.status === 'failed' ? 'This query could not be completed.' : ''}
                  queryId={query._id}
                />
              </div>
            )}
            
            {/* Query Form for follow-up questions */}
            {query && (
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="mb-4 text-lg font-medium">Ask a follow-up question</h3>
                <QueryForm 
                  onSubmit={handleSubmit} 
                  isLoading={false} 
                  placeholder="Ask a follow-up question..." 
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}