import axios from 'axios';
import { getStoredPlatformSession } from '../../features/platform-auth/lib/platform-auth-storage';

const baseURL = `${import.meta.env.VITE_API_URL}/api/platform`;

export const platformApiClient = axios.create({
  baseURL,
});

platformApiClient.interceptors.request.use((config) => {
  const { accessToken } = getStoredPlatformSession();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
