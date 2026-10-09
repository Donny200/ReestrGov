import type { StatusTone } from '../../components/ui/Badge';
import type { ReportCategory, ReportEntityType, ReportStatus, ReportStatusFilter } from '../../types/reports';
import type { Translate } from '../../utils/errors';

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
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

export const REPORT_STATUS_FILTERS: ReportStatusFilter[] = ['OPEN', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'ALL'];

export const ALL_REPORT_CATEGORIES: ReportCategory[] = [
  'INCORRECT_INFORMATION',
  'OUTDATED_INFORMATION',
  'DOCUMENTS_OR_STEPS',
  'FEES_OR_TIMING',
  'CONTACT_DETAILS',
  'BROKEN_LINK',
  'TRANSLATION',
  'OTHER',
];

export const reportStatusFilterLabels: Record<ReportStatusFilter, string> = {
  OPEN: 'Open',
  ALL: 'All',
  ...reportStatusLabels,
};

export const REPORT_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  NEW: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['IN_PROGRESS'],
  REJECTED: ['IN_PROGRESS'],
};

export const CLOSED_REPORT_STATUSES: ReportStatus[] = ['RESOLVED', 'REJECTED'];

export const REPORT_MANAGE_PERMISSION = 'ORG_REPORTS_MANAGE';
export const REPORT_VIEW_PERMISSIONS = ['REPORTS_VIEW', REPORT_MANAGE_PERMISSION] as const;

export function canManageReports(hasPermission: (permission: string) => boolean): boolean {
  return hasPermission(REPORT_MANAGE_PERMISSION) || (hasPermission('REPORTS_VIEW') && hasPermission('REPORTS_MANAGE'));
}

export function canViewReports(hasPermission: (permission: string) => boolean): boolean {
  return REPORT_VIEW_PERMISSIONS.some(hasPermission);
}

export const reportStatusTones: Record<ReportStatus, StatusTone> = {
  NEW: 'pending',
  IN_PROGRESS: 'draft',
  RESOLVED: 'published',
  REJECTED: 'danger',
};

export function reportStatusLabel(status: ReportStatus, t: Translate): string {
  return t(`reports.status.${status}`, reportStatusLabels[status]);
}

export function reportTypeLabel(type: ReportEntityType, t: Translate): string {
  return type === 'FUNCTION' ? t('reports.typeFunction', 'Service') : t('reports.typeOrganization', 'Organization');
}
