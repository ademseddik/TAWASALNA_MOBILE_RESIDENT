import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_ENV } from '../utils/BaseUrl';

// Shared Axios instance
const http = axios.create({
  baseURL: APP_ENV?.BASE_URL || '',
});

// Attach Authorization token if available
http.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('USER_ACCESS');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // Ignore token read errors to avoid blocking requests
  }
  return config;
});

export default http;


