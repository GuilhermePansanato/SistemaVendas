import type { AuthSession } from '../types/auth-session';

const AUTH_STORAGE_KEY = 'sistema-vendas.auth-session';

const emptySession: AuthSession = {
  accessToken: null,
  user: null,
};

export function getStoredSession(): AuthSession {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return emptySession;
  }

  try {
    const parsed = JSON.parse(rawValue) as AuthSession;
    const normalizedUser = parsed.user
      ? {
          ...parsed.user,
          modules: Array.isArray(parsed.user.modules) ? parsed.user.modules : [],
        }
      : null;

    return {
      accessToken: parsed.accessToken ?? null,
      user: normalizedUser,
    };
  } catch {
    return emptySession;
  }
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
