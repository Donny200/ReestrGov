import type { CatalogFunction, ServiceInstructions, TranslatedText } from './api';

export type FunctionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'DEACTIVATED';

export type FunctionTransition = 'submit-for-review' | 'reject' | 'publish' | 'reactivate';

export interface AdminFunction extends Omit<CatalogFunction, 'organizationId' | 'categoryId' | 'sourceLanguage'> {
  organizationId: number | null;
  categoryId: number | null;
  status: FunctionStatus;
  sourceLanguage: string;
  verifiedByUserId?: number | null;
}

export interface FunctionCategory {
  id: number;
  name: string;
  nameTranslations?: Record<string, TranslatedText>;
}

export interface FunctionOrganization {
  id: number;
  name: string;
}

export interface FunctionFormValues {
  name: string;
  description: string;
  requirements: string;
  organizationId: string;
  categoryId: string;
  sourceLanguage: string;
  whoCanUse: string;
  steps: string;
  requiredDocuments: string;
  whereHowToApply: string;
  processingTime: string;
  fee: string;
  officialSourceUrl: string;
}

export interface CreateFunctionRequest {
  name: string;
  description: string;
  requirements: string;
  organizationId: number;
  categoryId?: number;
  sourceLanguage: string;
  instructions: ServiceInstructions;
  officialSourceUrl: string;
}

export interface UpdateFunctionRequest extends CreateFunctionRequest {
  category?: string;
}

export interface FunctionAuditEntry {
  id: number;
  performedByUserId: number | null;
  performedBy: string;
  action: string;
  performedAt: string;
  details: string;
}

export const FUNCTION_STATUSES: FunctionStatus[] = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'DEACTIVATED'];

export const statusLabels: Record<FunctionStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  PUBLISHED: 'Published',
  DEACTIVATED: 'Deactivated',
};
