import { z } from 'zod';
import type { Translate } from '../../utils/errors';
import { optionalString, requiredString } from '../../lib/validation';
import type { AdminFunction, CreateFunctionRequest, FunctionFormValues, UpdateFunctionRequest } from '../../types/adminFunctions';
import type { ServiceInstructions } from '../../types/api';
import { INSTRUCTION_FIELDS } from '../../utils/instructions';

export const NAME_MAX = 150;
export const DESCRIPTION_MAX = 500;
export const REQUIREMENTS_MAX = 500;
export const REASON_MAX = 2000;
export const SOURCE_URL_MAX = 500;
export const MAX_LIST_ITEMS = 50;

const WEB_LINK = /^https?:\/\/[^\s/?#]+\S*$/i;

export function officialLinkField(t: Translate) {
  return z
    .string()
    .trim()
    .max(SOURCE_URL_MAX)
    .refine((value) => value === '' || WEB_LINK.test(value), t('validation.url', 'Enter a full link that starts with https://'));
}

function instructionField(t: Translate, max: number, list: boolean) {
  return optionalString(max).refine(
    (value) => !list || value.split('\n').filter((line) => line.trim()).length <= MAX_LIST_ITEMS,
    t('validation.tooManyItems', 'Use at most 50 lines'),
  );
}

export function functionFormSchema(t: Translate) {
  const instructions = Object.fromEntries(
    INSTRUCTION_FIELDS.map((field) => [field.key, instructionField(t, field.max, field.list)]),
  ) as Record<keyof ServiceInstructions, ReturnType<typeof instructionField>>;
  return z.object({
    name: requiredString(t, NAME_MAX),
    description: requiredString(t, DESCRIPTION_MAX),
    requirements: optionalString(REQUIREMENTS_MAX),
    organizationId: z.string().min(1, t('validation.selectOrg')),
    categoryId: z.string(),
    sourceLanguage: z.string().min(1, t('validation.required')),
    ...instructions,
    officialSourceUrl: officialLinkField(t),
  });
}

export function emptyFunctionForm(sourceLanguage: string): FunctionFormValues {
  return {
    name: '',
    description: '',
    requirements: '',
    organizationId: '',
    categoryId: '',
    sourceLanguage,
    whoCanUse: '',
    steps: '',
    requiredDocuments: '',
    whereHowToApply: '',
    processingTime: '',
    fee: '',
    officialSourceUrl: '',
  };
}

export function formOf(record: AdminFunction): FunctionFormValues {
  return {
    name: record.name,
    description: record.description ?? '',
    requirements: record.requirements ?? '',
    organizationId: record.organizationId === null ? '' : String(record.organizationId),
    categoryId: record.categoryId === null ? '' : String(record.categoryId),
    sourceLanguage: record.sourceLanguage,
    whoCanUse: record.instructions?.whoCanUse ?? '',
    steps: record.instructions?.steps ?? '',
    requiredDocuments: record.instructions?.requiredDocuments ?? '',
    whereHowToApply: record.instructions?.whereHowToApply ?? '',
    processingTime: record.instructions?.processingTime ?? '',
    fee: record.instructions?.fee ?? '',
    officialSourceUrl: record.officialSourceUrl ?? '',
  };
}

function instructionsOf(values: FunctionFormValues): ServiceInstructions {
  const text = (value: string) => value.trim() || null;
  return {
    whoCanUse: text(values.whoCanUse),
    steps: text(values.steps),
    requiredDocuments: text(values.requiredDocuments),
    whereHowToApply: text(values.whereHowToApply),
    processingTime: text(values.processingTime),
    fee: text(values.fee),
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
    instructions: instructionsOf(values),
    officialSourceUrl: values.officialSourceUrl.trim(),
  };
}

export function toUpdateRequest(values: FunctionFormValues): UpdateFunctionRequest {
  return { ...toCreateRequest(values), category: values.categoryId ? undefined : '' };
}
