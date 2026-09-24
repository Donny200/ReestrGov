import type { CatalogFunction, TranslatedText } from './api';

export type FunctionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'DEACTIVATED';
export interface AdminFunction extends Omit<CatalogFunction, 'organizationId'> {
  organizationId: number | null;
  categoryId: number | null;
  status: FunctionStatus;
  sourceLanguage: string;
}
export interface FunctionCategory {
  id: number;
  name: string;
  nameTranslations?: Record<string, TranslatedText>;
}
export interface FunctionOrganization { id: number; name: string }

export interface FunctionFormValues {
  name: string;
  description: string;
  requirements: string;
  organizationId: string;
  categoryId: string;
  sourceLanguage: string;
}
export interface CreateFunctionRequest {
  name: string;
  description: string;
  requirements: string;
  organizationId: number;
  categoryId?: number;
  sourceLanguage: string;
}
