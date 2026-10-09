import type {
  CreateLegacyUserRequest,
  LegacyUser,
  LegacyUserApi,
  UpdateLegacyUserRequest
} from '../types/api';
import { apiRequest } from './http';

/** Maps the compatibility user DTO to the existing page model. */
function normalize(user: LegacyUserApi): LegacyUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    enabled: user.enabled,
    organizations: user.organizationIds ?? []
  };
}

export async function getLegacyUsers(): Promise<LegacyUser[]> {
  const users = await apiRequest<LegacyUserApi[]>('/api/user');
  return users.map(normalize);
}

export async function getLegacyUser(id: number): Promise<LegacyUser> {
  return normalize(await apiRequest<LegacyUserApi>(`/api/user/${id}`));
}

/** Sends the backend DTO directly; the server resolves and validates every ID. */
export async function createLegacyUser(payload: CreateLegacyUserRequest): Promise<LegacyUser> {
  const created = await apiRequest<LegacyUserApi>('/api/user', {
    method: 'POST',
    body: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone || null,
      roleId: payload.roleId,
      organizationIds: payload.organizationIds
    }
  });
  return normalize(created);
}

/** Backend updates only firstName, lastName and email for this endpoint. */
export async function updateLegacyUser(id: number, payload: UpdateLegacyUserRequest): Promise<LegacyUser> {
  return normalize(await apiRequest<LegacyUserApi>(`/api/user/${id}`, { method: 'PUT', body: payload }));
}

/** The compatibility DELETE route performs a soft deactivation. */
export function deactivateLegacyUser(id: number): Promise<void> {
  return apiRequest<void>(`/api/user/${id}`, { method: 'DELETE' });
}
