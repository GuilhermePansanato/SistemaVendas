import type { PlatformAuthSession } from '../types/platform-auth-session';

const PLATFORM_AUTH_STORAGE_KEY = 'sistema-vendas.platform-auth-session';

const emptySession: PlatformAuthSession = {
  accessToken: null,
  user: null,
};

export function getStoredPlatformSession(): PlatformAuthSession {
  const rawValue = window.localStorage.getItem(PLATFORM_AUTH_STORAGE_KEY);

  if (!rawValue) {
    return emptySession;
  }

  try {
    const parsed = JSON.parse(rawValue) as PlatformAuthSession;

    return {
      accessToken: parsed.accessToken ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return emptySession;
  }
}

export function savePlatformSession(session: PlatformAuthSession) {
  window.localStorage.setItem(
    PLATFORM_AUTH_STORAGE_KEY,
    JSON.stringify(session),
  );
}

export function clearPlatformSession() {
  window.localStorage.removeItem(PLATFORM_AUTH_STORAGE_KEY);
}
