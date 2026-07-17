import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const EXAM_URL = process.env.NEXT_PUBLIC_EXAM_API_URL || 'http://localhost:4002';

export const apiClient = axios.create({
  baseURL: `${AUTH_URL}/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const examClient = axios.create({
  baseURL: `${EXAM_URL}/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ─────────────────────────────────────────
function attachToken(config: Parameters<typeof apiClient.interceptors.request.use>[0] extends infer T ? T : never) {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// @ts-ignore
apiClient.interceptors.request.use(attachToken);
// @ts-ignore
examClient.interceptors.request.use(attachToken);

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
async function handleRefresh(error: { response?: { status: number }; config: { _retry?: boolean } & Parameters<typeof axios>[0] }) {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();
    if (refreshToken) {
      try {
        const res = await axios.post(`${AUTH_URL}/v1/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
        const currentUser = useAuthStore.getState().user!;
        setAuth(currentUser, newAccess, newRefresh);
        error.config.headers = error.config.headers || {};
        error.config.headers.Authorization = `Bearer ${newAccess}`;
        return axios(error.config);
      } catch {
        clearAuth();
        window.location.href = '/auth/login';
      }
    }
  }
  return Promise.reject(error);
}

apiClient.interceptors.response.use((r) => r, handleRefresh);
examClient.interceptors.response.use((r) => r, handleRefresh);
