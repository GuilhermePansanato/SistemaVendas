import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import {
  clearPlatformSession,
  getStoredPlatformSession,
  savePlatformSession,
} from '../lib/platform-auth-storage';
import { getPlatformProfileRequest } from '../services/platform-auth-service';
import type { PlatformAuthSession } from '../types/platform-auth-session';
import {
  PlatformAuthContext,
  type PlatformAuthContextValue,
} from './platform-auth-context';

const initialSession = getStoredPlatformSession();

export function PlatformAuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<PlatformAuthSession>(initialSession);
  const [isHydrating, setIsHydrating] = useState(
    Boolean(initialSession.accessToken),
  );

  useEffect(() => {
    if (!session.accessToken) {
      setIsHydrating(false);
      return;
    }

    let isMounted = true;

    async function hydrateProfile() {
      try {
        const user = await getPlatformProfileRequest();

        if (!isMounted) {
          return;
        }

        const nextSession = {
          accessToken: session.accessToken,
          user,
        };

        setSession(nextSession);
        savePlatformSession(nextSession);
      } catch {
        if (!isMounted) {
          return;
        }

        clearPlatformSession();
        setSession({
          accessToken: null,
          user: null,
        });
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    void hydrateProfile();

    return () => {
      isMounted = false;
    };
  }, [session.accessToken]);

  const value = useMemo<PlatformAuthContextValue>(
    () => ({
      accessToken: session.accessToken,
      user: session.user,
      isAuthenticated: Boolean(session.accessToken),
      isHydrating,
      login: (nextSession) => {
        const normalizedSession = {
          accessToken: nextSession.accessToken,
          user: nextSession.user,
        };

        setSession(normalizedSession);
        savePlatformSession(normalizedSession);
      },
      logout: () => {
        clearPlatformSession();
        setSession({
          accessToken: null,
          user: null,
        });
      },
    }),
    [isHydrating, session.accessToken, session.user],
  );

  return (
    <PlatformAuthContext.Provider value={value}>
      {children}
    </PlatformAuthContext.Provider>
  );
}
