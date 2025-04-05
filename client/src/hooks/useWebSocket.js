'use client';

import { useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { WebSocketContext } from '@/context/WebSocketProvider';

export function useWebSocket(options = {}) {
  const {
    topics = [],
    onMessage = null,
    autoSubscribe = true,
  } = options;

  const context = useContext(WebSocketContext);
  const [lastMessage, setLastMessage] = useState(null);

  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  // ✅ Memoize topicsArray
  const topicsArray = useMemo(() => (
    Array.isArray(topics) ? topics : [topics].filter(Boolean)
  ), [topics]);

  // ✅ Subscribe/Unsubscribe on mount/unmount
  useEffect(() => {
    if (autoSubscribe && topicsArray.length > 0 && context.isConnected) {
      context.subscribe(topicsArray);
      return () => {
        context.unsubscribe(topicsArray);
      };
    }
  }, [context, topicsArray, autoSubscribe, context.isConnected]);

  // ✅ Memoize filtered messages
  const filteredMessages = useMemo(() => {
    if (!topicsArray.length) return context.messages;

    return context.messages.filter((message) => {
      if (message.topic) return topicsArray.includes(message.topic);
      if (message.data?.topic) return topicsArray.includes(message.data.topic);
      return false;
    });
  }, [context.messages, topicsArray]);

  // ✅ Effect to handle message callback and last message
  useEffect(() => {
    if (filteredMessages.length === 0) return;

    const lastMsg = filteredMessages[filteredMessages.length - 1];
    setLastMessage(lastMsg);

    if (onMessage && typeof onMessage === 'function') {
      onMessage(lastMsg, filteredMessages);
    }
  }, [filteredMessages, onMessage]);

  // ✅ Enhanced message sender
  const sendTopicMessage = useCallback((data, specificTopic = null) => {
    const topic = specificTopic || (topicsArray.length > 0 ? topicsArray[0] : null);
    if (!topic) return context.sendMessage(data);

    return context.sendMessage({ ...data, topic });
  }, [context, topicsArray]);

  // ✅ Stable connection status
  const connectionStatus = useMemo(() => {
    if (context.isConnected) return 'connected';
    if (context.reconnecting) return 'reconnecting';
    return 'disconnected';
  }, [context.isConnected, context.reconnecting]);

  return {
    ...context,
    messages: filteredMessages,
    lastMessage,
    sendTopicMessage,
    connectionStatus,
    isSubscribed: topicsArray.length > 0 && context.isConnected,
  };
}

export default useWebSocket;
