import type {
  AssignRoleRequest,
  CreatePermissionRequest,
  CreateRoleRequest,
  Permission,
  RoleEntity,
  UpdateRolePermissionsRequest
} from '../types/api';
import { apiRequest } from './http';

export function getPermissions(): Promise<Permission[]> {
  return apiRequest<Permission[]>('/api/permissions');
}

export function createPermission(payload: CreatePermissionRequest): Promise<Permission> {
  return apiRequest<Permission>('/api/permissions', { method: 'POST', body: payload });
}

export function getRoles(): Promise<RoleEntity[]> {
  return apiRequest<RoleEntity[]>('/api/roles');
}

export function getRole(id: number): Promise<RoleEntity> {
  return apiRequest<RoleEntity>(`/api/roles/${id}`);
}

/** The backend normalizes the name to uppercase and adds ROLE_ when needed. */
export function createRole(payload: CreateRoleRequest): Promise<RoleEntity> {
  return apiRequest<RoleEntity>('/api/roles', { method: 'POST', body: payload });
}

export function deleteRole(id: number): Promise<void> {
  return apiRequest<void>(`/api/roles/${id}`, { method: 'DELETE' });
}

export function assignRole(userId: number, roleId: number): Promise<string> {
  const body: AssignRoleRequest = { userId, roleId };
  return apiRequest<string>('/api/roles/assign', { method: 'POST', body });
}

/** Replaces the entire permission set. Send [] to clear every permission. */
export function updateRolePermissions(
  id: number,
  payload: UpdateRolePermissionsRequest
): Promise<RoleEntity> {
  return apiRequest<RoleEntity>(`/api/roles/${id}/permissions`, { method: 'PUT', body: payload });
}
