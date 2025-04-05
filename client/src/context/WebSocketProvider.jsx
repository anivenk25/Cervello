'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { connectWebSocket, disconnectWebSocket, sendWebSocketMessage } from '@/lib/websocket';
import { useAuth } from './AuthProvider';
import { toast } from 'react-hot-toast';

// Create context and export it
export const WebSocketContext = createContext({});

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  
  // Connect to WebSocket
  const connectToWebSocket = useCallback(() => {
    // Only connect if user is authenticated
    if (!isAuthenticated) return;
    
    try {
      // Use the WebSocket URL from environment variables or fallback to constructed URL
      const wsUrl = process.env.NEXT_PUBLIC_PATHWAY_WEBSOCKET_URL || 'ws://localhost:8080/ws';
      const ws = connectWebSocket(wsUrl);
      
      // Set up event listeners
      ws.addEventListener('open', () => {
        setIsConnected(true);
        setSocket(ws);
        setReconnectAttempts(0);
        
        // Authenticate the connection
        sendWebSocketMessage(ws, {
          type: 'auth',
          data: { userId: user?.id },
        });
        
        console.log('WebSocket connected');
      });
      
      ws.addEventListener('close', (event) => {
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`WebSocket disconnected. Attempting to reconnect in ${timeout/1000}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectToWebSocket();
          }, timeout);
        } else {
          toast.error('Unable to connect to real-time updates. Please refresh the page.');
          console.error('WebSocket reconnection failed after multiple attempts');
        }
      });
      
      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'update') {
            // Add the message to state
            setMessages((prev) => [...prev, data]);
            
            // Optional: Show toast notification for important updates
            if (data.priority === 'high') {
              toast.success(data.message || 'New update available');
            }
          } else if (data.type === 'error') {
            console.error('WebSocket error message:', data.message);
            toast.error(data.message || 'An error occurred');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      return ws;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      return null;
    }
  }, [isAuthenticated, user?.id, reconnectAttempts]);
  
  // Initialize connection
  useEffect(() => {
    const ws = connectToWebSocket();
    
    // Clean up on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        disconnectWebSocket(ws);
      }
    };
  }, [connectToWebSocket]);
  
  // Send a message through WebSocket
  const sendMessage = useCallback((data) => {
    if (!isConnected || !socket) {
      console.error('WebSocket is not connected');
      return false;
    }
    
    return sendWebSocketMessage(socket, data);
  }, [isConnected, socket]);
  
  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Subscribe to specific data sources or topics
  const subscribe = useCallback((topics) => {
    if (!isConnected || !socket) {
      console.error('Cannot subscribe: WebSocket is not connected');
      return false;
    }
    
    return sendWebSocketMessage(socket, {
      type: 'subscribe',
      data: { topics: Array.isArray(topics) ? topics : [topics] }
    });
  }, [isConnected, socket]);
  
  // Unsubscribe from specific topics
  const unsubscribe = useCallback((topics) => {
    if (!isConnected || !socket) {
      console.error('Cannot unsubscribe: WebSocket is not connected');
      return false;
    }
    
    return sendWebSocketMessage(socket, {
      type: 'unsubscribe',
      data: { topics: Array.isArray(topics) ? topics : [topics] }
    });
  }, [isConnected, socket]);
  
  const value = {
    isConnected,
    messages,
    sendMessage,
    clearMessages,
    subscribe,
    unsubscribe
  };
  
  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

// Custom hook for using WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;