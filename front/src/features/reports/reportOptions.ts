import type { ReportCategory, ReportEntityType, ReportStatus, ReportStatusFilter } from '../../types/reports';

export const REPORT_DESCRIPTION_MIN = 10;
export const REPORT_DESCRIPTION_MAX = 2000;
export const REPORT_CONTACT_MAX = 254;
export const REPORT_NOTE_MAX = 2000;
export const REPORT_CONTACT_PATTERN = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$|^\+?[0-9][0-9 ()-]{5,24}$/;

export const REPORT_CATEGORIES: Record<ReportEntityType, ReportCategory[]> = {
  FUNCTION: ['INCORRECT_INFORMATION', 'OUTDATED_INFORMATION', 'DOCUMENTS_OR_STEPS', 'FEES_OR_TIMING', 'BROKEN_LINK', 'TRANSLATION', 'OTHER'],
  ORGANIZATION: ['INCORRECT_INFORMATION', 'OUTDATED_INFORMATION', 'CONTACT_DETAILS', 'BROKEN_LINK', 'TRANSLATION', 'OTHER'],
};

export const reportCategoryLabels: Record<ReportCategory, string> = {
  INCORRECT_INFORMATION: 'Information is incorrect',
  OUTDATED_INFORMATION: 'Information is outdated',
  DOCUMENTS_OR_STEPS: 'Documents or steps are wrong',
  FEES_OR_TIMING: 'Fee or processing time is wrong',
  CONTACT_DETAILS: 'Address, phone or hours are wrong',
  BROKEN_LINK: 'A link does not work',
  TRANSLATION: 'Translation problem',
  OTHER: 'Something else',
};

export const reportStatusLabels: Record<ReportStatus, string> = {
  NEW: 'New',
  IN_REVIEW: 'In review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed',
};

export const REPORT_STATUS_FILTERS: ReportStatusFilter[] = ['OPEN', 'NEW', 'IN_REVIEW', 'RESOLVED', 'DISMISSED', 'ALL'];

export const reportStatusFilterLabels: Record<ReportStatusFilter, string> = {
  OPEN: 'Open',
  ALL: 'All',
  ...reportStatusLabels,
};

export const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  NEW: ['IN_REVIEW', 'RESOLVED', 'DISMISSED'],
  IN_REVIEW: ['RESOLVED', 'DISMISSED'],
  RESOLVED: ['IN_REVIEW'],
  DISMISSED: ['IN_REVIEW'],
};
