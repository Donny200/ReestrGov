import { apiRequest } from './http';
import type { AdminFunction, FunctionCategory } from '../types/adminFunctions';

export const getAdminFunctions = () => apiRequest<AdminFunction[]>('/api/functions/admin');
export const getFunctionCategories = () => apiRequest<FunctionCategory[]>('/api/functions/categories');
