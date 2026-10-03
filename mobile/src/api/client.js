import axios from 'axios';
import { Platform } from 'react-native';
import { getItem, setItem, deleteItem } from '../services/storage';

const envUrl = process.env.EXPO_PUBLIC_API_URL;
const BASE_URL = envUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Fallback if storage fails
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: refreshToken });
          const newAccess = res.data?.data?.access || res.data?.access;
          if (newAccess) {
            await setItem('access_token', newAccess);
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return api(originalRequest);
          }
        }
      } catch {
        await deleteItem('access_token');
        await deleteItem('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
