import axios from 'axios';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const EXAM_URL = process.env.NEXT_PUBLIC_EXAM_API_URL || 'http://localhost:4002';
const AI_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:4003';
const STREAMING_URL = process.env.NEXT_PUBLIC_STREAMING_API_URL || 'http://localhost:4004';
const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || 'http://localhost:4005';

export const authClient = axios.create({ baseURL: `${AUTH_URL}/v1`, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
export const examClient = axios.create({ baseURL: `${EXAM_URL}/v1`, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
export const aiClient = axios.create({ baseURL: `${AI_URL}/v1`, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
export const streamingClient = axios.create({ baseURL: `${STREAMING_URL}/v1`, timeout: 15000, headers: { 'Content-Type': 'application/json' } });
export const notificationClient = axios.create({ baseURL: `${NOTIFICATION_URL}/v1`, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

const attachToken = (config: any) => {
  const token = useAdminAuthStore.getState().accessToken;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
};
authClient.interceptors.request.use(attachToken);
examClient.interceptors.request.use(attachToken);
aiClient.interceptors.request.use(attachToken);
streamingClient.interceptors.request.use(attachToken);
notificationClient.interceptors.request.use(attachToken);
