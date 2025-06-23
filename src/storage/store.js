import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from './notificationsSlice';

export const store = configureStore({
  reducer: {
    notifications: notificationReducer,
  },
});
