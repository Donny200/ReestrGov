import type { CatalogFunction, FunctionQuery, UpdateFunctionRequirementsRequest } from '../types/api';
import { apiRequest } from './http';

/** GET /api/functions with optional organizationId or category filters. */
export function getFunctions(query: FunctionQuery = {}): Promise<CatalogFunction[]> {
  return apiRequest<CatalogFunction[]>('/api/functions', {
    query: { organizationId: query.organizationId, category: query.category }
  });
}

/** GET /api/functions/{id} */
export function getFunction(id: number): Promise<CatalogFunction> {
  return apiRequest<CatalogFunction>(`/api/functions/${id}`);
}

/** PUT /api/functions/{id}/requirements */
export function updateFunctionRequirements(
  id: number,
  payload: UpdateFunctionRequirementsRequest
): Promise<CatalogFunction> {
  return apiRequest<CatalogFunction>(`/api/functions/${id}/requirements`, { method: 'PUT', body: payload });
}
