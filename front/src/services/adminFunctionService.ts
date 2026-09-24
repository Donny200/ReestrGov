import { apiRequest } from './http';
import type { AdminFunction, FunctionCategory } from '../types/adminFunctions';

export const getAdminFunctions = () => apiRequest<AdminFunction[]>('/api/functions/admin');
export const getFunctionCategories = () => apiRequest<FunctionCategory[]>('/api/functions/categories');

export const createFunction = (body: import('../types/adminFunctions').CreateFunctionRequest) =>
  apiRequest<AdminFunction>('/api/functions', { method: 'POST', body });

export const getAdminFunction = (id: number) => apiRequest<AdminFunction>(`/api/functions/${id}/admin`);
export const updateFunction = (id: number, body: import('../types/adminFunctions').CreateFunctionRequest & { category?: string }) =>
  apiRequest<AdminFunction>(`/api/functions/${id}`, { method: 'PUT', body });

export const transitionFunction = (id: number, action: 'submit-for-review' | 'reject' | 'publish' | 'reactivate', reason?: string) =>
  apiRequest<AdminFunction>(`/api/functions/${id}/${action}`, { method: 'POST', body: reason === undefined ? undefined : { reason } });
export const deactivateFunction = (id: number) => apiRequest<void>(`/api/functions/${id}`, { method: 'DELETE' });
export interface FunctionAuditEntry {
  id: number; performedByUserId: number | null; performedBy: string; action: string; performedAt: string; details: string;
}
export const getFunctionAudit = (id: number) => apiRequest<FunctionAuditEntry[]>(`/api/functions/${id}/audit`);

export const saveFunctionTranslation = (id: number, language: string, body: { name: string; description: string }) =>
  apiRequest<AdminFunction>(`/api/functions/${id}/translations/${encodeURIComponent(language)}`, { method: 'PUT', body });
