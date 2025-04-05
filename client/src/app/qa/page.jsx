'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useOnboarding } from '@/hooks/useOnboarding';
import QueryForm from '@/components/qa/QueryForm';
import AnswerDisplay from '@/components/qa/AnswerDisplay';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

export default function QAPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryId, setQueryId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const answersEndRef = useRef(null);
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  
  // Use our enhanced WebSocket hook with topic filtering
  const { 
    messages, 
    sendTopicMessage, 
    isConnected,
    connectionStatus 
  } = useWebSocket({
    topics: ['query-results', 'system-notifications'],
    onMessage: (message) => {
      if (message.type === 'system_alert') {
        toast.info(message.data.message);
      }
    }
  });
  
  const { needsOnboarding, checkAndRedirect } = useOnboarding();
  
  // Scroll to bottom of answers
  const scrollToBottom = () => {
    answersEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Check if user needs onboarding
  useEffect(() => {
    if (!loading && needsOnboarding) {
      checkAndRedirect();
    }
  }, [loading, needsOnboarding, checkAndRedirect]);
  
  // Fetch user's query history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isAuthenticated) return;
      
      try {
        const data = await api.qa.getHistory(10);
        setHistory(data.queries || []);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast.error('Failed to load query history');
      }
    };
    
    if (isAuthenticated && !loading) {
      fetchHistory();
    }
  }, [isAuthenticated, loading]);
  
  // Listen for WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage.type === 'answer_stream') {
        // For streaming responses
        setAnswer(prev => prev + latestMessage.data.content);
      } else if (latestMessage.type === 'answer_complete') {
        // For complete answers
        setAnswer(latestMessage.data.answer);
        setSources(latestMessage.data.sources || []);
        setIsLoading(false);
        scrollToBottom();
        
        // Save query ID for feedback
        if (latestMessage.data.id) {
          setQueryId(latestMessage.data.id);
        }
        
        // Update history with new query
        if (latestMessage.data) {
          setHistory(prev => [latestMessage.data, ...prev].slice(0, 10));
        }
      } else if (latestMessage.type === 'error') {
        setError(latestMessage.data.message || 'An error occurred');
        setIsLoading(false);
        toast.error(latestMessage.data.message || 'Failed to get answer');
      }
    }
  }, [messages]);
  
  // Scroll to bottom when answer updates
  useEffect(() => {
    if (answer) {
      scrollToBottom();
    }
  }, [answer]);
  
  // Handle form submission
  const handleSubmit = async (questionText) => {
    if (!questionText.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      setQuestion(questionText);
      setAnswer('');
      setSources([]);
      setError('');
      setQueryId(null);
      
      // Use the streaming API if WebSocket is connected
      if (isConnected) {
        // Notify through WebSocket for streaming updates
        sendTopicMessage({
          type: 'query',
          data: { question: questionText },
          topic: 'query-results'
        });
        
        // Fallback if stream doesn't respond within 3 seconds
        const timeoutId = setTimeout(async () => {
          if (isLoading) {
            try {
              const data = await api.qa.askQuestion(questionText);
              setAnswer(data.answer);
              setSources(data.sources || []);
              setQueryId(data.id);
              setHistory(prev => [data, ...prev].slice(0, 10));
              setIsLoading(false);
            } catch (error) {
              console.error('Fallback API call failed:', error);
            }
          }
        }, 3000);
        
        return () => clearTimeout(timeoutId);
      } else {
        // Regular API call if WebSocket is not connected
        const data = await api.qa.askQuestion(questionText);
        
        setAnswer(data.answer);
        setSources(data.sources || []);
        setQueryId(data.id);
        
        // Add to history
        setHistory(prev => [data, ...prev].slice(0, 10));
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      setError(error.message || 'Something went wrong. Please try again.');
      toast.error('Failed to get an answer. Please try again.');
    } finally {
      if (!isConnected) {
        setIsLoading(false);
      }
    }
  };
  
  // Handle history item click
  const handleHistoryItemClick = (item) => {
    router.push(`/qa/${item._id || item.id}`);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }
  
  // Require authentication
  if (!loading && !isAuthenticated) {
    router.push('/auth/login?returnUrl=/qa');
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        history={history}
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
            {/* Connection status indicator */}
            {connectionStatus !== 'connected' && (
              <div className="mb-2 text-xs text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                  connectionStatus === 'reconnecting' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  <span className={`mr-1 w-2 h-2 rounded-full ${
                    connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  {connectionStatus === 'reconnecting' 
                    ? 'Reconnecting to real-time updates...' 
                    : 'Real-time updates unavailable'
                  }
                </span>
              </div>
            )}
            
            {/* Welcome message when no questions asked yet */}
            {!question && !answer && (
              <div className="text-center my-12">
                <h1 className="text-3xl font-bold mb-4">Welcome, {user?.name || 'there'}!</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Ask me anything, and I'll provide answers based on the latest available information.
                </p>
              </div>
            )}
            
            {/* Question & Answer display */}
            {question && (
              <div className="mb-8">
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/[.06] dark:border-white/[.08]">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Question</h2>
                  <p className="text-lg">{question}</p>
                </div>
                
                <AnswerDisplay 
                  answer={answer} 
                  sources={sources} 
                  isLoading={isLoading} 
                  error={error}
                  queryId={queryId}
                />
                
                <div ref={answersEndRef} />
              </div>
            )}
            
            {/* Query Form */}
            <div className="sticky bottom-4">
              <QueryForm 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
                placeholder="Ask a question about the latest data..."
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}