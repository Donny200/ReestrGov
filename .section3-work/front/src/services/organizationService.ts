import type {
  CreateOrganizationRequest,
  Organization,
  PublicOrganization,
  UpdateOrganizationRequest
} from '../types/api';
import { apiRequest } from './http';

export function getPublicOrganizations(): Promise<PublicOrganization[]> {
  return apiRequest<PublicOrganization[]>('/api/public/organizations');
}

export function getPublicOrganization(id: number): Promise<PublicOrganization> {
  return apiRequest<PublicOrganization>(`/api/public/organizations/${id}`);
}

export function getOrganizations(): Promise<Organization[]> {
  return apiRequest<Organization[]>('/api/organizations');
}

export function getOrganization(id: number): Promise<Organization> {
  return apiRequest<Organization>(`/api/organizations/${id}`);
}

export function createOrganization(payload: CreateOrganizationRequest): Promise<Organization> {
  return apiRequest<Organization>('/api/organizations', { method: 'POST', body: payload });
}

export function updateOrganization(id: number, payload: UpdateOrganizationRequest): Promise<Organization> {
  return apiRequest<Organization>(`/api/organizations/${id}`, { method: 'PUT', body: payload });
}

/** The backend deactivates the record; it does not physically delete it. */
export function deactivateOrganization(id: number): Promise<void> {
  return apiRequest<void>(`/api/organizations/${id}`, { method: 'DELETE' });
}
