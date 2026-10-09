import type { AuthUser, ChangePasswordRequest, LoginRequest } from '../types/api';
import { ApiError, apiRequest, refreshSession } from './http';

/**
 * Authentication is cookie-based. Tokens are HttpOnly and are never stored or
 * read by the frontend. GET /api/user/profile is deliberately not used.
 */

export function login(payload: LoginRequest): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/login', {
    method: 'POST',
    body: payload,
    skipRefresh: true,
    skipUnauthorizedHandler: true
  });
}

export async function refresh(): Promise<void> {
  if (!await refreshSession()) throw new ApiError(401, 'Sessiya muddati tugadi');
}

export function logout(): Promise<void> {
  return apiRequest<void>('/api/auth/logout', { method: 'POST', skipRefresh: true });
}

/** Restores a session without forcing public pages to redirect to /login. */
export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/me', { skipUnauthorizedHandler: true });
}

export function changePassword(payload: ChangePasswordRequest): Promise<void> {
  return apiRequest<void>('/api/auth/change-password', { method: 'POST', body: payload });
}
