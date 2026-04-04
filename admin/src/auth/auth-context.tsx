import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AuthContext, type AuthUser, type LoginPayload } from './auth-store';
import { ACCESS_TOKEN_KEY, api } from '../lib/api';

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return true;
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(
    async ({ username, password }: LoginPayload) => {
      setLoading(true);

      try {
        const response = await api.post('/auth/login', { username, password });
        const token = response.data?.access_token as string | undefined;

        if (token) {
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
        }

        const verified = await checkSession();
        if (!verified) {
          throw new Error('Could not verify your session after login. Please try again.');
        }
      } catch (error) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        setUser(null);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [checkSession],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors and still clear local session.
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      checkSession,
    }),
    [user, loading, login, logout, checkSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
