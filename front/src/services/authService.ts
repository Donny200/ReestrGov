import type { AuthUser, ChangePasswordRequest, LoginRequest, PasswordResetOptions } from '../types/api';
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

export const getPasswordResetOptions = () =>
  apiRequest<PasswordResetOptions>('/api/auth/password-reset/options', { skipRefresh: true, skipUnauthorizedHandler: true });

/** Always answers the same way whether or not the address belongs to an account. */
export const requestPasswordReset = (email: string) =>
  apiRequest<void>('/api/auth/password-reset/request', { method: 'POST', body: { email }, skipRefresh: true, skipUnauthorizedHandler: true });

export const completePasswordReset = (token: string, newPassword: string) =>
  apiRequest<void>('/api/auth/password-reset/complete', { method: 'POST', body: { token, newPassword }, skipRefresh: true, skipUnauthorizedHandler: true });
