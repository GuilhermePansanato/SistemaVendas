import { createContext } from 'react';
import type {
  PlatformAuthSession,
  PlatformLoginResponse,
} from '../types/platform-auth-session';

export interface PlatformAuthContextValue extends PlatformAuthSession {
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (session: PlatformLoginResponse) => void;
  logout: () => void;
}

export const PlatformAuthContext =
  createContext<PlatformAuthContextValue | null>(null);
