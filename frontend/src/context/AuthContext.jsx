import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still checking the session, null = signed out
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    authApi.getUser().then(setUser).catch(() => setUser(null));
  }, []);

  // Any API call that comes back 401 means the session ended.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (payload) => setUser(await authApi.login(payload)), []);
  const register = useCallback(async (payload) => setUser(await authApi.register(payload)), []);
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading: user === undefined, login, register, logout, setUser }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
