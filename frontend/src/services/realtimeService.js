// frontend/src/services/realtimeService.js

import { API_BASE_URL } from './apiConfig'; // Assuming you have this for HTTP API

// Derive WebSocket URL from your API_BASE_URL or define separately
// If API_BASE_URL is 'http://localhost:8000/api', WSS_BASE_URL could be 'ws://localhost:8000'
// Ensure you use 'ws://' for local development and 'wss://' for production (secure)
const WSS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';

let wsHost = window.location.host;
// If developing locally and your WebSocket server is on a different port (e.g., 8000 for Daphne)
if (window.location.hostname === 'localhost' && window.location.port !== '8000') {
  // Assuming Daphne runs on port 8000 for localhost development
  wsHost = 'localhost:8000'; 
}
const WSS_BASE_URL = `${WSS_PROTOCOL}://${wsHost}`.replace(/^http/, 'ws');

let socket = null;
let onMessageHandler = null;

/**
 * Connects to the WebSocket server for a specific restaurant's waitlist.
 * @param {string} restaurantId - The ID of the restaurant.
 * @param {function} onMessage - Callback function to handle incoming messages.
 *                               It will receive the parsed message object.
 */
const connectToWaitlistSocket = (restaurantId, onMessage) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket is already connected.');
    // If connecting for a different restaurant, close old and open new
    if (socket.url.includes(`/ws/waitlist/${restaurantId}`)) {
        onMessageHandler = onMessage; // Update handler if it's the same connection
        return;
    }
    socket.close();
  }

  const WSS_URL = `${WSS_BASE_URL}/ws/waitlist/${restaurantId}`; // Matches Python backend example
  console.log(`Attempting to connect to WebSocket: ${WSS_URL}`);

  socket = new WebSocket(WSS_URL);
  onMessageHandler = onMessage;

  socket.onopen = () => {
    console.log(`WebSocket connected successfully to ${WSS_URL}`);
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (onMessageHandler) {
        onMessageHandler(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message or in handler:', error);
      console.error('Raw message data:', event.data);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    // You might want to trigger a UI update or a reconnect attempt here
  };

  socket.onclose = (event) => {
    console.log('WebSocket disconnected:', event.code, event.reason);
    socket = null;
    onMessageHandler = null;
    // Optionally, implement automatic reconnection logic here
    // Be careful with infinite loops if the server is down.
  };
};

/**
 * Disconnects the WebSocket.
 */
const disconnectWebSocket = () => {
  if (socket) {
    console.log('Disconnecting WebSocket...');
    socket.close();
    socket = null;
    onMessageHandler = null;
  }
};

// If you need to send messages from client to server via WebSocket (not in this primary use case)
// const sendWebSocketMessage = (message) => {
//   if (socket && socket.readyState === WebSocket.OPEN) {
//     socket.send(JSON.stringify(message));
//   } else {
//     console.error('WebSocket is not connected or not open. Cannot send message.');
//   }
// };

export { connectToWaitlistSocket, disconnectWebSocket /*, sendWebSocketMessage */ };