import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from './BaseUrl';

const activeNotificationSockets = new Map();

function createNotificationWrapper(socket, callbacks) {
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

export const initializeNotificationSocket = async () => {
  const userId = await AsyncStorage.getItem("userId");

  if (activeNotificationSockets.has(userId)) {
    const { socket, callbacks } = activeNotificationSockets.get(userId);
    return createNotificationWrapper(socket, callbacks);
  }

  const socket = new WebSocket(`${APP_ENV.NOTIFICATION_WS_URL}?userId=${userId}`);

  const callbacks = {};

  socket.onopen = () => {
    console.log('Notification WebSocket connected');
    if (callbacks.open) {
      callbacks.open();
    }
  };

  socket.onmessage = (event) => {
    try {
      const notification = JSON.parse(event.data);
      console.log('Received notification:', notification);
      if (notification.type && callbacks[notification.type]) {
        callbacks[notification.type](notification);
      } else if (callbacks.message) { // Generic message handler if type is not specific
        callbacks.message(notification);
      }
    } catch (error) {
      console.error('Error parsing notification:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('Notification WebSocket error:', error);
    if (callbacks.error) {
      callbacks.error(error);
    }
  };

  socket.onclose = () => {
    console.log('Notification WebSocket disconnected');
    if (callbacks.close) {
      callbacks.close();
    }
    activeNotificationSockets.delete(userId);
  };

  activeNotificationSockets.set(userId, { socket, callbacks });
  return createNotificationWrapper(socket, callbacks);
};

export const disconnectNotificationSocket = (userId) => {
  if (activeNotificationSockets.has(userId)) {
    const { socket } = activeNotificationSockets.get(userId);
    socket.close();
    activeNotificationSockets.delete(userId);
  }
};