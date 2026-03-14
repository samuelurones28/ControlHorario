import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url === '/auth/refresh' ||
        originalRequest.url?.startsWith('/auth/login')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        setAccessToken(data.accessToken);

        window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: data.accessToken }));

        return api(originalRequest);
      } catch (err) {
        window.dispatchEvent(new Event('refreshTokenFailed'));
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Helper methods
export const getMe = () => api.get('/auth/me');
export const getPrivacyPolicy = () => api.get('/privacy/policy');
export const checkPrivacyConsent = () => api.get('/privacy/me');
export const acceptPrivacyConsent = (version: string) => api.post('/privacy/accept', { version });
export const getAuditLogs = (page: number = 1, limit: number = 50) =>
  api.get('/audit-logs', { params: { page, limit } });
export const exportReport = (from: string, to: string, format: 'csv' | 'pdf' = 'csv') =>
  api.get('/reports/export', {
    params: { from, to, format },
    responseType: format === 'pdf' ? 'blob' : 'text'
  });
