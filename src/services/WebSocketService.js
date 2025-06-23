import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../utils/BaseUrl';

// Store active clients by userId
const activeClients = new Map();

function createWrapper(client, callbacks) {
  return {
    on: (event, callback) => {
      callbacks[event] = callback;
    },
    disconnect: () => {
      if (client.active) {
        client.deactivate();
      }
    }
  };
}

export const initializeSocket = async () => {
  const userId = await AsyncStorage.getItem("userId");
  
  if (activeClients.has(userId)) {
    const { client, callbacks } = activeClients.get(userId);
    return createWrapper(client, callbacks);
  }

  const socket = new SockJS(`${APP_ENV.WS_URL}`);
  
  const stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    heartbeatIncoming: 1000,
    heartbeatOutgoing: 1000,
    debug: (str) => console.log(str),
    connectHeaders: { userId },
    onConnect: () => {
      console.log('STOMP Connected');
      
      stompClient.subscribe(`/user/${userId}/queue/notifications`, (message) => {
        const notification = JSON.parse(message.body);
        const callbacks = activeClients.get(userId)?.callbacks || {};
        
        if (notification.type && callbacks[notification.type]) {
          callbacks[notification.type](notification);
        }
      });
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame.headers.message);
    },
    onDisconnect: () => {
      console.log('STOMP Disconnected');
      const callbacks = activeClients.get(userId)?.callbacks || {};
      if (callbacks.disconnect) {
        callbacks.disconnect();
      }
      activeClients.delete(userId);
    }
  });

  stompClient.activate();
  
  const callbacks = {};
  activeClients.set(userId, { client: stompClient, callbacks });
  
  return createWrapper(stompClient, callbacks);
};

export const disconnectSocket = (userId) => {
  if (activeClients.has(userId)) {
    const { client } = activeClients.get(userId);
    if (client.active) {
      client.deactivate();
    }
    activeClients.delete(userId);
  }
};