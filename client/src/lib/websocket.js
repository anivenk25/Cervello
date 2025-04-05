'use client';

// Track socket instances
let socket = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000; // Start with 1 second

/**
 * Connect to a WebSocket server
 * @param {string} url WebSocket URL to connect to
 * @returns {WebSocket} The WebSocket connection
 */
export const connectWebSocket = (url) => {
  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Generate default URL if none provided
  if (!url) {
    if (typeof window !== 'undefined') {
      // Check if we're in a browser environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url = `${protocol}//${window.location.host}/api/websocket`;
    } else {
      throw new Error('WebSocket URL must be provided in non-browser environments');
    }
  }

  // If a socket exists and is already connecting/open, return it
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return socket;
  }

  try {
    // Create new WebSocket connection
    socket = new WebSocket(url);

    // Connection opened
    socket.addEventListener('open', (event) => {
      console.log('WebSocket connection established');
      // Reset reconnect attempts on successful connection
      reconnectAttempts = 0;
    });

    // Listen for errors
    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
    });

    // Connection closed
    socket.addEventListener('close', (event) => {
      console.log(`WebSocket connection closed: ${event.code} - ${event.reason || 'No reason provided'}`);
      
      // Don't attempt reconnection if explicitly closed (code 1000)
      if (event.code === 1000) {
        socket = null;
        return;
      }
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts - 1);
        console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimeout = setTimeout(() => {
          socket = null; // Clear the old socket reference
          connectWebSocket(url);
        }, delay);
      } else {
        console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        socket = null;
      }
    });

    return socket;
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    socket = null;
    throw error;
  }
};

/**
 * Disconnect from the WebSocket server
 * @param {WebSocket} specificSocket Optional specific socket to disconnect
 */
export const disconnectWebSocket = (specificSocket = null) => {
  // Clear any reconnection attempts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  const socketToClose = specificSocket || socket;
  
  if (socketToClose) {
    // Only close if it's not already closing or closed
    if (socketToClose.readyState === WebSocket.OPEN || socketToClose.readyState === WebSocket.CONNECTING) {
      // 1000 is a normal closure code indicating intentional disconnect
      socketToClose.close(1000, 'Deliberately closed by client');
    }
    
    // If we're closing the main socket reference, clear it
    if (!specificSocket) {
      socket = null;
    }
  }
};

/**
 * Send a message over the WebSocket connection
 * @param {WebSocket} specificSocket Optional specific socket to use
 * @param {Object} data Data to send
 * @returns {boolean} Whether the message was sent successfully
 */
export const sendWebSocketMessage = (specificSocket, data) => {
  // Handle both direct passing of data and passing socket first
  let socketToUse;
  let dataToSend;
  
  if (specificSocket instanceof WebSocket) {
    socketToUse = specificSocket;
    dataToSend = data;
  } else {
    socketToUse = socket;
    dataToSend = specificSocket; // In this case, specificSocket is actually the data
  }
  
  if (!socketToUse || socketToUse.readyState !== WebSocket.OPEN) {
    console.error('WebSocket is not connected');
    return false;
  }

  try {
    // Convert to string if it's an object
    const message = typeof dataToSend === 'object' 
      ? JSON.stringify(dataToSend) 
      : dataToSend;
      
    socketToUse.send(message);
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
};

/**
 * Check if WebSocket is currently connected
 * @returns {boolean} Connection status
 */
export const isWebSocketConnected = () => {
  return socket !== null && socket.readyState === WebSocket.OPEN;
};

/**
 * Add event listener to the WebSocket
 * @param {string} event Event name ('message', 'open', 'close', 'error')
 * @param {Function} callback Event handler function
 * @returns {WebSocket|null} The current socket or null if not connected
 */
export const addWebSocketListener = (event, callback) => {
  if (!socket) return null;
  
  socket.addEventListener(event, callback);
  return socket;
};

/**
 * Remove event listener from the WebSocket
 * @param {string} event Event name
 * @param {Function} callback Event handler function
 * @returns {WebSocket|null} The current socket or null if not connected
 */
export const removeWebSocketListener = (event, callback) => {
  if (!socket) return null;
  
  socket.removeEventListener(event, callback);
  return socket;
};