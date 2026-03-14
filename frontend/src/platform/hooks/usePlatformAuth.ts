import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SUPPORT' | 'VIEWER';
}

export interface SetupInfo {
  secret: string;
  qrCodeUrl: string;
}

interface PlatformAuthState {
  admin: PlatformAdmin | null;
  token: string | null;
  isAuthenticated: boolean;
  // 2FA state
  requiresTOTP: boolean;   // backend naming - needs code entry
  needsSetup: boolean;     // backend naming - needs 2FA setup first
  pendingEmail: string | null;  // used during 2FA verification to pass email
  setupInfo: SetupInfo | null;  // QR + secret from backend during setup flow

  setAuth: (payload: { admin: PlatformAdmin; token: string }) => void;
  setPending2FA: (payload: { requiresTOTP: boolean; needsSetup: boolean; email: string; setupInfo?: SetupInfo }) => void;
  setToken: (token: string) => void;
  reset: () => void;
}

export const usePlatformAuth = create<PlatformAuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      requiresTOTP: false,
      needsSetup: false,
      pendingEmail: null,
      setupInfo: null,

      setAuth: (payload) =>
        set({
          admin: payload.admin,
          token: payload.token,
          isAuthenticated: true,
          requiresTOTP: false,
          needsSetup: false,
          pendingEmail: null,
          setupInfo: null,
        }),

      setPending2FA: (payload) =>
        set({
          requiresTOTP: payload.requiresTOTP,
          needsSetup: payload.needsSetup,
          pendingEmail: payload.email,
          setupInfo: payload.setupInfo || null,
          isAuthenticated: false,
        }),

      setToken: (token) =>
        set((state) => ({
          token,
          isAuthenticated: !!token && !state.requiresTOTP && !state.needsSetup,
        })),

      reset: () =>
        set({
          admin: null,
          token: null,
          isAuthenticated: false,
          requiresTOTP: false,
          needsSetup: false,
          pendingEmail: null,
          setupInfo: null,
        }),
    }),
    {
      name: 'platform-auth-storage',
    }
  )
);
