import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from './BaseUrl';

const activeChatClients = new Map();

export const initializeChatSocket = async () => {
  const userId = await AsyncStorage.getItem("userId");

  if (activeChatClients.has(userId)) {
    return activeChatClients.get(userId);
  }

  const client = new Client({
    brokerURL: APP_ENV.WS_URL,
    connectHeaders: {
      userId: userId, // You might need to send userId in headers for STOMP if your backend expects it for auth/session mapping
    },
    webSocketFactory: () => new SockJS(APP_ENV.WS_URL), // Use SockJS for broader compatibility
    debug: function (str) {
      console.log('STOMP Debug:', str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    // Add additional debugging options
    logRawCommunication: true,
    onWebSocketError: (error) => {
      console.error('STOMP WebSocket Error:', error);
    },
    onWebSocketClose: (event) => {
      console.log('STOMP WebSocket Closed:', event);
    },
    // Add STOMP-specific options
    appendMissingNULLonIncoming: true,
    forceClientHeartbeat: true,
    serverHeartbeat: 4000
  });

  // Store callbacks to manage subscriptions and messages
  const subscriptions = new Map();
  const messageListeners = new Map();

  client.onConnect = (frame) => {
    console.log('STOMP: Connected', frame);
    console.log('STOMP: Connection headers:', frame.headers);
    if (messageListeners.has('connected')) {
      messageListeners.get('connected').forEach(cb => cb());
    }
    // You can now set up a method to subscribe to topics
  };

  client.onStompError = (frame) => {
    console.error('STOMP: Broker reported error: ' + frame.headers['message']);
    console.error('STOMP: Additional details: ' + frame.body);
    console.error('STOMP: Error frame:', frame);
    if (messageListeners.has('error')) {
      messageListeners.get('error').forEach(cb => cb(frame));
    }
  };

  client.onDisconnect = (frame) => {
    console.log('STOMP: Disconnected', frame);
    if (messageListeners.has('disconnected')) {
      messageListeners.get('disconnected').forEach(cb => cb(frame));
    }
  };

  client.onWebSocketError = (error) => {
    console.error('STOMP: WebSocket error:', error);
    if (messageListeners.has('websocket_error')) {
      messageListeners.get('websocket_error').forEach(cb => cb(error));
    }
  };

  // Add global error handler for any unhandled errors
  client.onUnhandledFrame = (frame) => {
    console.error('STOMP: Unhandled frame received:', frame);
    if (messageListeners.has('unhandled_frame')) {
      messageListeners.get('unhandled_frame').forEach(cb => cb(frame));
    }
  };

  // Add global error handler for any parsing errors
  client.onUnhandledMessage = (message) => {
    console.error('STOMP: Unhandled message received:', message);
    if (messageListeners.has('unhandled_message')) {
      messageListeners.get('unhandled_message').forEach(cb => cb(message));
    }
  };

  client.activate();

  // Helper function to validate and debug STOMP messages
  const validateAndParseMessage = (message, destination) => {
    console.log('STOMP: Raw message received:', {
      destination,
      headers: message.headers,
      body: message.body,
      bodyType: typeof message.body,
      bodyLength: message.body ? message.body.length : 0,
      bodyPreview: message.body ? message.body.substring(0, 100) : 'undefined'
    });

    if (!message.headers) { // Check for missing headers
      console.warn('STOMP: Message missing headers');
    } else {
      console.log('STOMP: Message headers:', message.headers);
    }

    if (!message.body) {
      console.warn('STOMP: Message body is null/undefined');
      return { error: 'PARSE_ERROR', reason: 'EMPTY_BODY' };
    }

    if (typeof message.body !== 'string') {
      console.warn('STOMP: Message body is not a string:', typeof message.body);
      return { error: 'PARSE_ERROR', reason: 'INVALID_BODY_TYPE', bodyType: typeof message.body };
    }

    if (message.body.trim() === '') {
      console.warn('STOMP: Message body is empty string');
      return { error: 'PARSE_ERROR', reason: 'EMPTY_STRING_BODY' };
    }

    const trimmed = message.body.trim();

    // Handle null characters
    if (trimmed.includes('\u0000')) {
      console.warn('STOMP: Message body contains null characters');
      const cleaned = trimmed.replace(/\u0000/g, '');
      console.log('STOMP: Cleaned body:', cleaned);
      try {
        const parsed = JSON.parse(cleaned);
        return parsed;
      } catch (error) {
        console.error('STOMP: Failed to parse cleaned body:', error);
      }
    }

    // Handle double-encoded JSON (when body contains escaped quotes like \")
    if (trimmed.includes('\\"') && trimmed.startsWith('"') && trimmed.endsWith('"')) {
      console.log('STOMP: Detected double-encoded JSON, attempting to parse');
      try {
        // First parse the outer string to get the actual JSON string
        const jsonString = JSON.parse(trimmed);
        // Then parse the actual JSON content
        const parsed = JSON.parse(jsonString);
        console.log('STOMP: Successfully parsed double-encoded JSON');
        return parsed;
      } catch (error) {
        console.error('STOMP: Failed to parse double-encoded JSON:', error);
        // Fall through to other parsing attempts
      }
    }

    // Handle raw STOMP frames
    if (trimmed.startsWith('MESSAGE')) {
      console.warn('STOMP: Received raw STOMP frame instead of parsed message');
      // Try to extract the body from the STOMP frame
      const lines = trimmed.split('\n');
      let extractedBody = '';
      let inBody = false;
      
      for (const line of lines) {
        if (line.trim() === '') {
          inBody = true;
          continue;
        }
        if (inBody) {
          extractedBody += line;
        }
      }
      
      if (extractedBody) {
        console.log('STOMP: Extracted body from frame:', extractedBody);
        try {
          const parsed = JSON.parse(extractedBody);
          return parsed;
        } catch (error) {
          console.error('STOMP: Failed to parse extracted body:', error);
        }
      }
      
      return { error: 'PARSE_ERROR', reason: 'RAW_STOMP_FRAME', originalBody: message.body };
    }

    // Try direct JSON parsing
    try {
      const parsed = JSON.parse(message.body);
      return parsed;
    } catch (parseError) {
      console.error('STOMP: JSON parse error:', parseError.message);
      
      // Check if it looks like multi-line JSON
      if (trimmed.includes('\n')) {
        console.log('STOMP: Body contains newlines, might be multi-line JSON');
        const singleLine = trimmed.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        try {
          const parsed = JSON.parse(singleLine);
          return parsed;
        } catch (multiLineError) {
          console.error('STOMP: Failed to parse multi-line JSON:', multiLineError.message);
        }
      }
      
      // Try cleaning control characters and whitespace
      const cleaned = trimmed
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
        
      if (cleaned !== trimmed) {
        console.log('STOMP: Attempting to parse cleaned body:', cleaned);
        try {
          const parsed = JSON.parse(cleaned);
          return parsed;
        } catch (secondError) {
          console.error('STOMP: Failed to parse cleaned body:', secondError.message);
        }
      }
      
      return { 
        error: 'PARSE_ERROR', 
        reason: 'JSON_PARSE_FAILED', 
        originalBody: message.body, 
        cleanedBody: cleaned, 
        errorMessage: parseError.message 
      };
    }
  };

  const chatSocketWrapper = {
    client: client,
    
    // Add a test method to help debug
    testConnection: () => {
      console.log('STOMP: Testing connection...');
      console.log('STOMP: Client state:', client.connected ? 'Connected' : 'Disconnected');
      console.log('STOMP: WebSocket state:', client.webSocket ? client.webSocket.readyState : 'No WebSocket');
      return {
        connected: client.connected,
        webSocketState: client.webSocket ? client.webSocket.readyState : null,
        brokerURL: APP_ENV.WS_URL
      };
    },
    
    // Add a method to get connection status
    getConnectionStatus: () => {
      return {
        connected: client.connected,
        webSocketState: client.webSocket ? client.webSocket.readyState : null,
        client: client
      };
    },
    
    // Add a method to force connection
    forceConnect: () => {
      if (!client.connected) {
        console.log('STOMP: Forcing connection...');
        client.activate();
        return true;
      }
      return false;
    },
    
    // Add a method to enable comprehensive logging
    enableDebugLogging: (enabled = true) => {
      if (enabled) {
        console.log('STOMP: Debug logging enabled');
        // Override the debug function to log everything
        client.debug = function(str) {
          console.log('STOMP Debug:', str);
        };
      } else {
        console.log('STOMP: Debug logging disabled');
        client.debug = function(str) {
          // Silent debug
        };
      }
    },
    
    // Add a method to dump all received messages
    dumpMessages: () => {
      console.log('Active subscriptions:', Array.from(subscriptions.keys()));
      console.log('Active message listeners:', Array.from(messageListeners.keys()));
      console.log('Message listener counts:', Array.from(messageListeners.entries()).map(([event, listeners]) => `${event}: ${listeners.length}`));
      
      // Show active error listeners
      const errorEvents = ['error', 'unhandled_frame', 'unhandled_message', 'websocket_error', 'disconnected'];
      errorEvents.forEach(event => {
        if (messageListeners.has(event)) {
          console.log(`Active ${event} listeners:`, messageListeners.get(event).length);
        }
      });
      
      return {
        subscriptions: Array.from(subscriptions.keys()),
        listeners: Array.from(messageListeners.keys()),
        listenerCounts: Array.from(messageListeners.entries()).map(([event, listeners]) => ({ event, count: listeners.length }))
      };
    },
    
    subscribe: (destination, callback) => {
      try {
        const subscription = client.subscribe(destination, (message) => {
          try {
            const parsedMessage = validateAndParseMessage(message, destination);
            callback(parsedMessage);
          } catch (error) {
            console.error('STOMP: Error in subscription callback for', destination, ':', error);
            // Call the callback with an error object so the UI can handle it gracefully
            callback({ 
              error: 'CALLBACK_ERROR', 
              reason: 'SUBSCRIPTION_CALLBACK_FAILED', 
              destination,
              errorMessage: error.message,
              originalMessage: message 
            });
          }
        });
        subscriptions.set(destination, subscription);
        return subscription;
      } catch (error) {
        
        throw error;
      }
    },
    unsubscribe: (destination) => {
      const subscription = subscriptions.get(destination);
      if (subscription) {
        subscription.unsubscribe();
        subscriptions.delete(destination);
      }
    },
    sendMessage: (destination, body) => {
      client.publish({ destination: destination, body: JSON.stringify(body) });
    },
    on: (eventName, callback) => {
      if (!messageListeners.has(eventName)) {
        messageListeners.set(eventName, []);
      }
      messageListeners.get(eventName).push(callback);
    },
    off: (eventName, callback) => {
      if (messageListeners.has(eventName)) {
        const listeners = messageListeners.get(eventName);
        messageListeners.set(eventName, listeners.filter(cb => cb !== callback));
      }
    },
    disconnect: () => {
      client.deactivate();
      activeChatClients.delete(userId);
    },
    addListener: (event, callback) => {
      if (!messageListeners.has(event)) {
        messageListeners.set(event, []);
      }
      messageListeners.get(event).push(callback);
    },

    removeListener: (event, callback) => {
      if (messageListeners.has(event)) {
        const listeners = messageListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    },

    // Add specific error listener methods
    onError: (callback) => {
      chatSocketWrapper.addListener('error', callback);
    },

    onUnhandledFrame: (callback) => {
      chatSocketWrapper.addListener('unhandled_frame', callback);
    },

    onUnhandledMessage: (callback) => {
      chatSocketWrapper.addListener('unhandled_message', callback);
    },

    onWebSocketError: (callback) => {
      chatSocketWrapper.addListener('websocket_error', callback);
    },

    onDisconnected: (callback) => {
      chatSocketWrapper.addListener('disconnected', callback);
    },

    // Add method to check for unhandled errors
    hasUnhandledErrors: () => {
      const errorEvents = ['error', 'unhandled_frame', 'unhandled_message', 'websocket_error'];
      return errorEvents.some(event => messageListeners.has(event) && messageListeners.get(event).length > 0);
    },

    // Add method to get error count
    getErrorCount: () => {
      const errorEvents = ['error', 'unhandled_frame', 'unhandled_message', 'websocket_error'];
      return errorEvents.reduce((total, event) => {
        return total + (messageListeners.has(event) ? messageListeners.get(event).length : 0);
      }, 0);
    },

    // Add method to clear all error listeners
    clearErrorListeners: () => {
      const errorEvents = ['error', 'unhandled_frame', 'unhandled_message', 'websocket_error'];
      errorEvents.forEach(event => {
        if (messageListeners.has(event)) {
          messageListeners.delete(event);
        }
      });
      console.log('STOMP: All error listeners cleared');
    }
  };

  activeChatClients.set(userId, chatSocketWrapper);
  return chatSocketWrapper;
};

export const disconnectChatSocket = (userId) => {
  if (activeChatClients.has(userId)) {
    activeChatClients.get(userId).disconnect();
  }
};