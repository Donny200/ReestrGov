import type { AuthUser, ChangePasswordRequest, LoginRequest } from '../types/api';
import { ApiError, apiRequest, refreshSession } from './http';

export const login = (payload: LoginRequest) =>
  apiRequest<AuthUser>('/api/auth/login', { method: 'POST', body: payload, skipRefresh: true, skipUnauthorizedHandler: true });

export async function refresh(): Promise<void> {
  if (!(await refreshSession())) throw new ApiError(401, 'Session expired');
}

export const logout = () => apiRequest<void>('/api/auth/logout', { method: 'POST', skipRefresh: true });

export const getCurrentUser = () => apiRequest<AuthUser>('/api/auth/me', { skipUnauthorizedHandler: true });

export const changePassword = (payload: ChangePasswordRequest) =>
  apiRequest<void>('/api/auth/change-password', { method: 'POST', body: payload });
