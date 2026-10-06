import { apiRequest } from './http';
import type {
  AdminFunction,
  CreateFunctionRequest,
  FunctionAuditEntry,
  FunctionCategory,
  FunctionTransition,
  UpdateFunctionRequest,
} from '../types/adminFunctions';

export type { FunctionAuditEntry };

export const getAdminFunctions = () => apiRequest<AdminFunction[]>('/api/functions/admin');

export const getAdminFunction = (id: number) => apiRequest<AdminFunction>(`/api/functions/${id}/admin`);

export const getFunctionCategories = () => apiRequest<FunctionCategory[]>('/api/functions/categories');

export const createFunction = (body: CreateFunctionRequest) =>
  apiRequest<AdminFunction>('/api/functions', { method: 'POST', body });

export const updateFunction = (id: number, body: UpdateFunctionRequest) =>
  apiRequest<AdminFunction>(`/api/functions/${id}`, { method: 'PUT', body });

export const transitionFunction = (id: number, action: FunctionTransition, reason?: string) =>
  apiRequest<AdminFunction>(`/api/functions/${id}/${action}`, {
    method: 'POST',
    body: reason === undefined ? undefined : { reason },
  });

export const deactivateFunction = (id: number) => apiRequest<void>(`/api/functions/${id}`, { method: 'DELETE' });

export const getFunctionAudit = (id: number) => apiRequest<FunctionAuditEntry[]>(`/api/functions/${id}/audit`);

export const saveFunctionTranslation = (id: number, language: string, body: { name: string; description: string }) =>
  apiRequest<AdminFunction>(`/api/functions/${id}/translations/${encodeURIComponent(language)}`, { method: 'PUT', body });

export const getTranslationCapabilities = () =>
  apiRequest<{ available: boolean }>('/api/functions/translation-capabilities');

export const translateFunction = (id: number, languages: string[], overwriteMachine = false) =>
  apiRequest<AdminFunction>(`/api/functions/${id}/translate`, { method: 'POST', body: { languages, overwriteMachine } });
