import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser { id: string; name: string; email: string; role: string; }

interface AdminAuthState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, at: string, rt: string) => void;
  clearAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'admin-auth' }
  )
);
