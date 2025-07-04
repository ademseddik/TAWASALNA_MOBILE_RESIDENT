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
  });

  // Store callbacks to manage subscriptions and messages
  const subscriptions = new Map();
  const messageListeners = new Map();

  client.onConnect = (frame) => {
    console.log('STOMP: Connected', frame);
    if (messageListeners.has('connected')) {
      messageListeners.get('connected').forEach(cb => cb());
    }
    // You can now set up a method to subscribe to topics
  };

  client.onStompError = (frame) => {
    console.error('STOMP: Broker reported error: ' + frame.headers['message']);
    console.error('STOMP: Additional details: ' + frame.body);
    if (messageListeners.has('error')) {
      messageListeners.get('error').forEach(cb => cb(frame));
    }
  };

  client.activate();

  const chatSocketWrapper = {
    client: client,
    subscribe: (destination, callback) => {
      const subscription = client.subscribe(destination, (message) => {
        try {
          const parsedMessage = JSON.parse(message.body);
          callback(parsedMessage);
        } catch (error) {
          console.error('Error parsing STOMP message:', error);
        }
      });
      subscriptions.set(destination, subscription);
      return subscription; // Return the subscription object for potential unsubscription
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