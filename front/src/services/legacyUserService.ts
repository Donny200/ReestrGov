import type { CreateLegacyUserRequest, LegacyUser, LegacyUserApi, UpdateLegacyUserRequest } from '../types/api';
import { apiRequest } from './http';

function normalize(user: LegacyUserApi): LegacyUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    enabled: user.enabled,
    organizations: user.organizationIds ?? [],
  };
}

export const getLegacyUsers = async (): Promise<LegacyUser[]> => {
  const users = await apiRequest<LegacyUserApi[]>('/api/user');
  return users.map(normalize);
};

export const createLegacyUser = async (payload: CreateLegacyUserRequest): Promise<LegacyUser> => {
  const created = await apiRequest<LegacyUserApi>('/api/user', {
    method: 'POST',
    body: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone || null,
      roleId: payload.roleId,
      organizationIds: payload.organizationIds,
    },
  });
  return normalize(created);
};

export const updateLegacyUser = async (id: number, payload: UpdateLegacyUserRequest): Promise<LegacyUser> =>
  normalize(await apiRequest<LegacyUserApi>(`/api/user/${id}`, { method: 'PUT', body: payload }));

export const deactivateLegacyUser = (id: number) => apiRequest<void>(`/api/user/${id}`, { method: 'DELETE' });
