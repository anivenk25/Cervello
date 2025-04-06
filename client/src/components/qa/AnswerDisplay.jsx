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

  // Handle ticket creation
  const handleCreateTicket = () => {
    if (!queryId) return;
    
    try {
      // You can add your API call here if needed
      toast.success('Ticket action triggered');
      
      // Example of how you might call an API:
      /*
      fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryId,
          userId: session?.user?.id,
          question: document.querySelector('p.text-lg')?.textContent || 'No question available',
          answer: answer || 'No answer available'
        }),
      })
      .then(response => {
        if (response.ok) {
          toast.success('Ticket created successfully');
        } else {
          toast.error('Failed to create ticket');
        }
      })
      .catch(error => {
        console.error('Error creating ticket:', error);
        toast.error('Error creating ticket');
      });
      */
    } catch (error) {
      console.error('Error handling ticket action:', error);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-[#420D0D] border border-[#991B1B] text-red-400 rounded-xl">
        <h3 className="font-bold mb-2 text-white/90">Error</h3>
        <p className="text-sm sm:text-base">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="p-4 sm:p-6 bg-[#111827] rounded-xl shadow-lg shadow-[#3b82f6]/5 border border-[#2d3748]">
        <h2 className="text-xs sm:text-sm font-medium text-white/60 mb-2">Answer</h2>
        
        {isLoading && !answer && (
          <div className="flex items-center space-x-2 py-4">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-[#3b82f6] rounded-full"></div>
              <div className="h-2 w-2 bg-[#3b82f6] rounded-full animation-delay-100"></div>
              <div className="h-2 w-2 bg-[#3b82f6] rounded-full animation-delay-200"></div>
            </div>
            <p className="text-white/60 text-sm sm:text-base">Generating answer...</p>
          </div>
        )}
        
        {answer && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-white/90">
            <ReactMarkdown>
              {answer}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Sources section */}
        {sources && sources.length > 0 && preferences?.showSources !== false && (
          <div className="mt-6 pt-4 border-t border-[#2d3748]">
            <h3 className="text-xs sm:text-sm font-medium text-white/60 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Sources
            </h3>
            <ul className="space-y-2">
              {sources.map((source, index) => (
                <li key={index} className="text-xs sm:text-sm p-2 sm:p-3 bg-[#0a0e17] rounded-lg border border-[#2d3748]">
                  <div className="font-medium text-white/90">{source.title || 'Untitled Source'}</div>
                  {source.url && (
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#3b82f6] hover:text-[#60a5fa] hover:underline text-xs"
                    >
                      {source.url}
                    </a>
                  )}
                  {source.snippet && (
                    <p className="mt-1 text-xs text-white/70">{source.snippet}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Action buttons section */}
        {answer && !isLoading && queryId && (
          <div className="mt-6 pt-4 border-t border-[#2d3748] flex flex-wrap justify-between items-center">
            {/* Feedback buttons */}
            {!feedback && (
              <div className="text-xs sm:text-sm">
                <p className="text-white/60 mb-2">Was this answer helpful?</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => submitFeedback(5)}
                    className="p-1 text-white/60 hover:text-[#3b82f6] transition-colors"
                    aria-label="Very helpful"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="p-1 text-white/60 hover:text-red-500 transition-colors"
                    aria-label="Not helpful"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* Ticket button */}
            <button
              onClick={handleCreateTicket}
              className="px-3 py-1 text-xs sm:text-sm text-white bg-[#3b82f6] rounded-md hover:bg-[#2563eb] transition"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Create Ticket
              </span>
            </button>
          </div>
        )}
        
        {/* Feedback form */}
        {showFeedbackForm && (
          <div className="mt-4">
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="What could be improved?"
              rows={3}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-[#2d3748] rounded-md bg-[#0a0e17] text-white placeholder:text-white/40 focus:border-[#3b82f6] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
            />
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
              <button
                onClick={() => submitFeedback(1)}
                disabled={isFeedbackSubmitting}
                className="px-3 py-1 text-xs sm:text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50"
              >
                {isFeedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                onClick={() => setShowFeedbackForm(false)}
                className="px-3 py-1 text-xs sm:text-sm border border-[#2d3748] rounded-md hover:bg-[#1e293b] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {feedback && (
          <div className="mt-6 pt-4 border-t border-[#2d3748] text-xs sm:text-sm text-white/60 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Thank you for your feedback!
          </div>
        )}
      </div>
    </div>
  );
}