import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser, RoleName } from '../types/api';
import * as authService from '../services/authService';
import { onUnauthorized } from '../services/http';

interface AuthValue {
  user: AuthUser | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Landing route per role. */
export function homeRouteForRole(role: RoleName): string {
  switch (role) {
    case 'ROLE_SUPER_ADMIN':
    case 'ROLE_ORG_ADMIN':
    case 'ROLE_MODERATOR':
      return '/admin';
    default:
      return '/';
  }
}

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const current = await authService.getCurrentUser();
      setUser(current);
    } catch {
      // 401 on boot simply means "not signed in" — no redirect from here.
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void loadUser().finally(() => setInitializing(false));
  }, [loadUser]);

  useEffect(() => {
    // Refresh already failed at this point (see services/http.ts) — bounce to login.
    onUnauthorized(() => {
      setUser(null);
      navigate('/login', { replace: true });
    });
    return () => onUnauthorized(null);
  }, [navigate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const authenticated = await authService.login({ email, password });
    setUser(authenticated);
    return authenticated;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const hasRole = useCallback((...roles: RoleName[]) => user ? roles.includes(user.role) : false, [user]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      initializing,
      signIn,
      signOut,
      refreshUser: loadUser,
      hasRole,
      isSuperAdmin: user?.role === 'ROLE_SUPER_ADMIN',
      isOrgAdmin: user?.role === 'ROLE_ORG_ADMIN',
      isModerator: user?.role === 'ROLE_MODERATOR'
    }),
    [user, initializing, signIn, signOut, loadUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}