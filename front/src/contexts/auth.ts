import { createContext, useContext } from 'react';
import type { AuthUser, RoleName } from '../types/api';

export interface AuthValue {
  user: AuthUser | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isModerator: boolean;
}

export const AuthContext = createContext<AuthValue | null>(null);

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

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
