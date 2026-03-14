import { create } from 'zustand';
import { api, setAccessToken } from '../services/api';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  company: string;
}

interface AuthState {
  user: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email?: string; password?: string; companyCode?: string; identifier?: string; pin?: string }, isAdmin: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: Employee, token: string) => void;
  reset: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts loading until we figure out auth state via refresh token
  login: async (data: { email?: string; password?: string; companyCode?: string; identifier?: string; pin?: string }, isAdmin: boolean) => {
    const endpoint = isAdmin ? '/auth/login/admin' : '/auth/login/employee';
    const res = await api.post(endpoint, data);
    setAccessToken(res.data.accessToken);
    set({ user: res.data.employee || res.data.activeEmployee, isAuthenticated: true, isLoading: false });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setUser: (user, token) => {
    setAccessToken(token);
    set({ user, isAuthenticated: true, isLoading: false });
  },
  reset: () => set({ user: null, isAuthenticated: false, isLoading: false })
}));

window.addEventListener('tokenRefreshed', ((e: CustomEvent) => {
  setAccessToken(e.detail);
}) as EventListener);

window.addEventListener('refreshTokenFailed', () => {
  useAuth.getState().reset();
});
