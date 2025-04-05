'use client';

import { useState } from 'react';
import { useUserPreferences } from '@/context/UserPrefsProvider';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AnswerDisplay({ answer, sources = [], isLoading, error, queryId }) {
  const [feedback, setFeedback] = useState(null);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const { preferences } = useUserPreferences();
  const { data: session } = useSession();

  // Submit feedback for this answer
  const submitFeedback = async (rating) => {
    if (!queryId || isFeedbackSubmitting) return;
    
    try {
      setIsFeedbackSubmitting(true);
      
      const response = await fetch('/api/qa/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryId,
          rating,
          comment: feedbackComment,
          userId: session?.user?.id
        }),
      });
      
      if (response.ok) {
        setFeedback(rating);
        setShowFeedbackForm(false);
        toast.success('Feedback submitted. Thank you!');
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback');
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl">
        <h3 className="font-bold mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow border border-black/[.06] dark:border-white/[.08]">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Answer</h2>
        
        {isLoading && !answer && (
          <div className="flex items-center space-x-2 py-4">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-gray-500 dark:text-gray-400">Generating answer...</p>
          </div>
        )}
        
        {answer && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>
              {answer}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Sources section */}
        {sources && sources.length > 0 && preferences?.showSources !== false && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Sources</h3>
            <ul className="space-y-2">
              {sources.map((source, index) => (
                <li key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="font-medium">{source.title || 'Untitled Source'}</div>
                  {source.url && (
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                    >
                      {source.url}
                    </a>
                  )}
                  {source.snippet && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{source.snippet}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Feedback section */}
        {answer && !isLoading && queryId && !feedback && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Was this answer helpful?</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => submitFeedback(5)}
                  className="p-1 text-gray-500 hover:text-yellow-500 transition-colors"
                  aria-label="Very helpful"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowFeedbackForm(true)}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Not helpful"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                  </svg>
                </button>
              </div>
            </div>
            
            {showFeedbackForm && (
              <div className="mt-4">
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="What could be improved?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-transparent"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => submitFeedback(1)}
                    disabled={isFeedbackSubmitting}
                    className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {isFeedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button
                    onClick={() => setShowFeedbackForm(false)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {feedback && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            Thank you for your feedback!
          </div>
        )}
      </div>
    </div>
  );
}