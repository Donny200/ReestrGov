import { apiRequest } from './http';
import type { AdminFunction, FunctionCategory } from '../types/adminFunctions';

export const getAdminFunctions = () => apiRequest<AdminFunction[]>('/api/functions/admin');
export const getFunctionCategories = () => apiRequest<FunctionCategory[]>('/api/functions/categories');

export const createFunction = (body: import('../types/adminFunctions').CreateFunctionRequest) =>
  apiRequest<AdminFunction>('/api/functions', { method: 'POST', body });

export const getAdminFunction = (id: number) => apiRequest<AdminFunction>(`/api/functions/${id}/admin`);
export const updateFunction = (id: number, body: import('../types/adminFunctions').CreateFunctionRequest & { category?: string }) =>
  apiRequest<AdminFunction>(`/api/functions/${id}`, { method: 'PUT', body });
