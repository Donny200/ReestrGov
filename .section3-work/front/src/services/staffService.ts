import type {
  CreateModeratorRequest,
  CreateOrgAdminRequest,
  LegacyUserApi,
  PromoteModeratorRequest,
  PromoteOrgAdminRequest,
  StaffUser,
  UpdateModeratorRequest,
  UpdateOrgAdminRequest
} from '../types/api';
import { apiRequest } from './http';

/* The only endpoint that lists arbitrary users is the legacy /api/user API.
 * Normalize its entity-shaped response before it reaches staff-management UI. */
function normalizeUser(user: LegacyUserApi): StaffUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    enabled: user.enabled,
    organizationIds: user.organizationIds ?? []
  };
}

export function getOrgAdmins(): Promise<StaffUser[]> {
  return apiRequest<StaffUser[]>('/api/admin/org-admins');
}

export function getOrgAdmin(id: number): Promise<StaffUser> {
  return apiRequest<StaffUser>(`/api/admin/org-admins/${id}`);
}

export function createOrgAdmin(payload: CreateOrgAdminRequest): Promise<StaffUser> {
  return apiRequest<StaffUser>('/api/admin/org-admins', { method: 'POST', body: payload });
}

export function promoteOrgAdmin(payload: PromoteOrgAdminRequest): Promise<StaffUser> {
  return apiRequest<StaffUser>('/api/admin/org-admins/promote', { method: 'POST', body: payload });
}

export function updateOrgAdmin(id: number, payload: UpdateOrgAdminRequest): Promise<StaffUser> {
  return apiRequest<StaffUser>(`/api/admin/org-admins/${id}`, { method: 'PUT', body: payload });
}

export function deactivateOrgAdmin(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/org-admins/${id}`, { method: 'DELETE' });
}

export function getModerators(): Promise<StaffUser[]> {
  return apiRequest<StaffUser[]>('/api/admin/moderators');
}

export function getModerator(id: number): Promise<StaffUser> {
  return apiRequest<StaffUser>(`/api/admin/moderators/${id}`);
}

export function createModerator(payload: CreateModeratorRequest): Promise<StaffUser> {
  return apiRequest<StaffUser>('/api/admin/moderators', { method: 'POST', body: payload });
}

export function promoteModerator(payload: PromoteModeratorRequest): Promise<StaffUser> {
  return apiRequest<StaffUser>('/api/admin/moderators/promote', { method: 'POST', body: payload });
}

export function updateModerator(id: number, payload: UpdateModeratorRequest): Promise<StaffUser> {
  return apiRequest<StaffUser>(`/api/admin/moderators/${id}`, { method: 'PUT', body: payload });
}

export function deactivateModerator(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/moderators/${id}`, { method: 'DELETE' });
}

/** SUPER_ADMIN-only compatibility list used for arbitrary role assignment. */
export async function getRoleAssignmentCandidates(): Promise<StaffUser[]> {
  const users = await apiRequest<LegacyUserApi[]>('/api/user');
  return users.map(normalizeUser);
}

export function getModeratorCandidates(): Promise<StaffUser[]> {
  return apiRequest<StaffUser[]>('/api/admin/moderators/candidates');
}

export function getOrgAdminCandidates(): Promise<StaffUser[]> {
  return apiRequest<StaffUser[]>('/api/admin/org-admins/candidates');
}
