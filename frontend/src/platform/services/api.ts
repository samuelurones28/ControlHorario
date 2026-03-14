import axios from 'axios';
import { usePlatformAuth } from '../hooks/usePlatformAuth';

export const platformApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

platformApi.interceptors.request.use((config) => {
  const token = usePlatformAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

platformApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${platformApi.defaults.baseURL}/platform/auth/refresh`,
          {},
          { withCredentials: true }
        );
        usePlatformAuth.getState().setToken(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return platformApi(originalRequest);
      } catch (refreshError) {
        usePlatformAuth.getState().reset();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
