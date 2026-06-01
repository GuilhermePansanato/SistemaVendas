import axios from 'axios';
import { getStoredSession } from '../../features/auth/lib/auth-storage';

const baseURL = `${import.meta.env.VITE_API_URL}/api`;

export const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = getStoredSession();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
