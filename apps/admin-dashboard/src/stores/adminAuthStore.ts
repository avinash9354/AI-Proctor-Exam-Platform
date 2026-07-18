import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser { id: string; name: string; email: string; role: any; department?: string; createdAt?: string; }

interface AdminAuthState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, at: string, rt: string) => void;
  updateUser: (user: Partial<AdminUser> | AdminUser) => void;
  clearAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateUser: (updated) => set((s) => ({ user: s.user ? { ...s.user, ...updated } : (updated as AdminUser) })),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'admin-auth' }
  )
);
