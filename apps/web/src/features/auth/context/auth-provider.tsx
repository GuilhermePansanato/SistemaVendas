import { useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { clearSession, getStoredSession, saveSession } from '../lib/auth-storage';
import { getProfileRequest } from '../services/auth-service';
import type { AuthSession } from '../types/auth-session';
import { AuthContext, type AuthContextValue } from './auth-context';

const initialSession = getStoredSession();

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession>(initialSession);
  const [isHydrating, setIsHydrating] = useState(Boolean(initialSession.accessToken));

  useEffect(() => {
    if (!session.accessToken) {
      setIsHydrating(false);
      return;
    }

    let isMounted = true;

    async function hydrateProfile() {
      try {
        const user = await getProfileRequest();

        if (!isMounted) {
          return;
        }

        const nextSession = {
          accessToken: session.accessToken,
          user,
        };

        setSession(nextSession);
        saveSession(nextSession);
      } catch {
        if (!isMounted) {
          return;
        }

        clearSession();
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

  const value = useMemo<AuthContextValue>(
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
        saveSession(normalizedSession);
      },
      logout: () => {
        clearSession();
        setSession({
          accessToken: null,
          user: null,
        });
      },
    }),
    [isHydrating, session.accessToken, session.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
