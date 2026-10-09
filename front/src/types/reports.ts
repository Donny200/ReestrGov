export type ReportEntityType = 'FUNCTION' | 'ORGANIZATION';

export type ReportStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type ReportStatusFilter = 'OPEN' | 'ALL' | ReportStatus;

export type ReportCategory =
  | 'INCORRECT_INFORMATION'
  | 'OUTDATED_INFORMATION'
  | 'DOCUMENTS_OR_STEPS'
  | 'FEES_OR_TIMING'
  | 'CONTACT_DETAILS'
  | 'BROKEN_LINK'
  | 'TRANSLATION'
  | 'OTHER';

export interface SubmitReportRequest {
  entityType: ReportEntityType;
  entityId: number;
  category: ReportCategory;
  description: string;
  contact: string;
  language: string;
  website: string;
}

export interface InformationReport {
  id: number;
  entityType: ReportEntityType;
  entityId: number;
  entityLabel: string;
  organizationId: number;
  category: ReportCategory;
  description: string;
  contact: string | null;
  language: string | null;
  status: ReportStatus;
  resolutionNote: string | null;
  handledByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportQuery {
  status: ReportStatusFilter;
  entityType?: ReportEntityType;
  entityId?: number;
}
