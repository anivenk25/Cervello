'use client';

import { useContext, useEffect, useCallback, useState } from 'react';
import { WebSocketContext } from '@/context/WebSocketProvider';

/**
 * Enhanced hook for WebSocket functionality with topic-specific message filtering
 * and automatic reconnection handling
 * 
 * @param {Object} options Configuration options
 * @param {Array|string} options.topics Topics to filter messages by
 * @param {Function} options.onMessage Callback for handling incoming messages
 * @param {boolean} options.autoSubscribe Whether to automatically subscribe to topics
 * @returns {Object} WebSocket state and enhanced methods
 */
export function useWebSocket(options = {}) {
  const {
    topics = [],
    onMessage = null,
    autoSubscribe = true
  } = options;
  
  const context = useContext(WebSocketContext);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  // Convert topics to array if string is provided
  const topicsArray = Array.isArray(topics) ? topics : [topics].filter(Boolean);
  
  // Subscribe to topics on mount if autoSubscribe is true
  useEffect(() => {
    if (autoSubscribe && topicsArray.length > 0 && context.isConnected) {
      context.subscribe(topicsArray);
      
      // Unsubscribe on unmount
      return () => {
        context.unsubscribe(topicsArray);
      };
    }
  }, [context, topicsArray, autoSubscribe]);
  
  // Filter messages based on topics
  useEffect(() => {
    if (!topicsArray.length) {
      setFilteredMessages(context.messages);
      return;
    }
    
    const filtered = context.messages.filter(message => {
      // If message has a topic field, check if it matches any of our topics
      if (message.topic) {
        return topicsArray.includes(message.topic);
      }
      
      // If message has data with topic field, check that
      if (message.data?.topic) {
        return topicsArray.includes(message.data.topic);
      }
      
      // Otherwise, include all messages when no specific topics are requested
      return topicsArray.length === 0;
    });
    
    setFilteredMessages(filtered);
    
    // Set last message if we have any messages
    if (filtered.length > 0) {
      const lastMsg = filtered[filtered.length - 1];
      setLastMessage(lastMsg);
      
      // Call onMessage callback if provided
      if (onMessage && typeof onMessage === 'function') {
        onMessage(lastMsg, filtered);
      }
    }
  }, [context.messages, topicsArray, onMessage]);
  
  // Enhanced send message function that automatically adds topic
  const sendTopicMessage = useCallback((data, specificTopic = null) => {
    const topic = specificTopic || (topicsArray.length > 0 ? topicsArray[0] : null);
    
    if (!topic) {
      return context.sendMessage(data);
    }
    
    return context.sendMessage({
      ...data,
      topic
    });
  }, [context, topicsArray]);
  
  // Get connection status with more details
  const connectionStatus = useCallback(() => {
    if (context.isConnected) return 'connected';
    if (context.reconnecting) return 'reconnecting';
    return 'disconnected';
  }, [context.isConnected, context.reconnecting]);
  
  return {
    ...context,
    messages: filteredMessages,
    lastMessage,
    sendTopicMessage,
    connectionStatus: connectionStatus(),
    isSubscribed: topicsArray.length > 0 && context.isConnected
  };
}

export default useWebSocket;