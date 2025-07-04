import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../utils/BaseUrl';

const activeSockets = new Map();

function createWrapper(socket, callbacks) {
  return {
    on: (event, callback) => {
      callbacks[event] = callback;
    },
    disconnect: () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    }
  };
}

export const initializeSocket = async () => {
  const userId = await AsyncStorage.getItem("userId");
  
  if (activeSockets.has(userId)) {
    const { socket, callbacks } = activeSockets.get(userId);
    return createWrapper(socket, callbacks);
  }

  // Use the new notification endpoint
  const socket = new WebSocket(`${APP_ENV.NOTIFICATION_WS_URL}?userId=${userId}`);
  
  const callbacks = {};
  
  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  
   socket.onmessage = (event) => {
    try {
      const notification = JSON.parse(event.data);
      // Call the appropriate callback based on notification type
      if (notification.type && callbacks[notification.type]) {
        callbacks[notification.type](notification);
      } else if (callbacks[notification.type]) {
       
        callbacks[notification.type](notification);
      }
    } catch (error) {
      console.error('Error parsing notification:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected');
    if (callbacks.disconnect) {
      callbacks.disconnect();
    }
    activeSockets.delete(userId);
  };

  activeSockets.set(userId, { socket, callbacks });
  return createWrapper(socket, callbacks);
};

export const disconnectSocket = (userId) => {
  if (activeSockets.has(userId)) {
    const { socket } = activeSockets.get(userId);
    socket.close();
    activeSockets.delete(userId);
  }
};