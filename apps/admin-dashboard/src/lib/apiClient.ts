import axios from 'axios';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const EXAM_URL = process.env.NEXT_PUBLIC_EXAM_API_URL || 'http://localhost:4002';

export const authClient = axios.create({ baseURL: `${AUTH_URL}/v1`, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
export const examClient = axios.create({ baseURL: `${EXAM_URL}/v1`, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

const attachToken = (config: Parameters<typeof authClient.interceptors.request.use>[0] extends infer T ? T : never) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
};
// @ts-ignore
authClient.interceptors.request.use(attachToken);
// @ts-ignore
examClient.interceptors.request.use(attachToken);
