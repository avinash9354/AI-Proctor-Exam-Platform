import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const EXAM_URL = process.env.NEXT_PUBLIC_EXAM_API_URL || 'http://localhost:4002';
const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:4005';

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

export const notificationClient = axios.create({
  baseURL: `${NOTIFICATION_URL}/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ─────────────────────────────────────────
function attachToken(config: any) {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

apiClient.interceptors.request.use(attachToken);
examClient.interceptors.request.use(attachToken);
notificationClient.interceptors.request.use(attachToken);

// ─── Helper: Flatten Zod/object errors into a clean string ────────────────────
function formatApiError(error: any) {
  if (error?.response?.data?.error && typeof error.response.data.error === 'object') {
    const errObj = error.response.data.error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    const parts: string[] = [];
    if (Array.isArray(errObj.formErrors) && errObj.formErrors.length > 0) {
      parts.push(...errObj.formErrors);
    }
    if (errObj.fieldErrors && typeof errObj.fieldErrors === 'object') {
      for (const [field, msgs] of Object.entries(errObj.fieldErrors)) {
        if (Array.isArray(msgs) && msgs.length > 0) {
          parts.push(`${field}: ${msgs.join(', ')}`);
        } else if (typeof msgs === 'string') {
          parts.push(`${field}: ${msgs}`);
        }
      }
    }
    if (parts.length > 0) {
      error.response.data.error = parts.join(' | ');
    } else {
      error.response.data.error = JSON.stringify(errObj);
    }
  }
  return error;
}

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
async function handleRefresh(error: any) {
  const formattedError = formatApiError(error);
  if (formattedError.response?.status === 401 && !formattedError.config._retry) {
    formattedError.config._retry = true;
    const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();
    if (refreshToken) {
      try {
        const res = await axios.post(`${AUTH_URL}/v1/auth/refresh`, { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;
        const currentUser = useAuthStore.getState().user!;
        setAuth(currentUser, newAccess, newRefresh);
        formattedError.config.headers = formattedError.config.headers || {};
        formattedError.config.headers.Authorization = `Bearer ${newAccess}`;
        return axios(formattedError.config);
      } catch {
        clearAuth();
        window.location.href = '/auth/login';
      }
    }
  }
  return Promise.reject(formattedError);
}

apiClient.interceptors.response.use((r) => r, handleRefresh);
examClient.interceptors.response.use((r) => r, handleRefresh);
notificationClient.interceptors.response.use((r) => r, handleRefresh);
