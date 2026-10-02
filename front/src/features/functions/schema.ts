import { z } from 'zod';
import type { Translate } from '../../utils/errors';
import { optionalString, requiredString } from '../../lib/validation';
import type { AdminFunction, CreateFunctionRequest, FunctionFormValues, UpdateFunctionRequest } from '../../types/adminFunctions';

export const NAME_MAX = 150;
export const DESCRIPTION_MAX = 500;
export const REQUIREMENTS_MAX = 500;
export const REASON_MAX = 2000;

export function functionFormSchema(t: Translate) {
  return z.object({
    name: requiredString(t, NAME_MAX),
    description: requiredString(t, DESCRIPTION_MAX),
    requirements: optionalString(REQUIREMENTS_MAX),
    organizationId: z.string().min(1, t('validation.selectOrg')),
    categoryId: z.string(),
    sourceLanguage: z.string().min(1, t('validation.required')),
  });
}

export function emptyFunctionForm(sourceLanguage: string): FunctionFormValues {
  return { name: '', description: '', requirements: '', organizationId: '', categoryId: '', sourceLanguage };
}

export function formOf(record: AdminFunction): FunctionFormValues {
  return {
    name: record.name,
    description: record.description ?? '',
    requirements: record.requirements ?? '',
    organizationId: record.organizationId === null ? '' : String(record.organizationId),
    categoryId: record.categoryId === null ? '' : String(record.categoryId),
    sourceLanguage: record.sourceLanguage,
  };
}

export function toCreateRequest(values: FunctionFormValues): CreateFunctionRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    requirements: values.requirements,
    organizationId: Number(values.organizationId),
    categoryId: values.categoryId ? Number(values.categoryId) : undefined,
    sourceLanguage: values.sourceLanguage,
  };
}

export function toUpdateRequest(values: FunctionFormValues): UpdateFunctionRequest {
  return { ...toCreateRequest(values), category: values.categoryId ? undefined : '' };
}
