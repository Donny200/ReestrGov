import type { CatalogFunction, FunctionQuery, UpdateFunctionRequirementsRequest } from '../types/api';
import { apiRequest } from './http';

export function getFunctions(query: FunctionQuery = {}): Promise<CatalogFunction[]> {
  return apiRequest<CatalogFunction[]>('/api/functions', {
    query: { organizationId: query.organizationId, category: query.category }
  });
}

export function getFunction(id: number): Promise<CatalogFunction> {
  return apiRequest<CatalogFunction>(`/api/functions/${id}`);
}

export function updateFunctionRequirements(
  id: number,
  payload: UpdateFunctionRequirementsRequest
): Promise<CatalogFunction> {
  return apiRequest<CatalogFunction>(`/api/functions/${id}/requirements`, { method: 'PUT', body: payload });
}
