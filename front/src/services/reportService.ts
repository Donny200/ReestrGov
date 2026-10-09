import { apiRequest } from './http';
import type { InformationReport, ReportQuery, ReportStatus, SubmitReportRequest } from '../types/reports';

export const submitReport = (body: SubmitReportRequest) =>
  apiRequest<{ received: boolean }>('/api/reports', { method: 'POST', body, skipRefresh: true, skipUnauthorizedHandler: true });

export const getReports = (query: ReportQuery) =>
  apiRequest<InformationReport[]>('/api/reports', {
    query: { status: query.status, entityType: query.entityType, entityId: query.entityId },
  });

export const updateReportStatus = (id: number, status: ReportStatus, note: string) =>
  apiRequest<InformationReport>(`/api/reports/${id}/status`, { method: 'PUT', body: { status, note } });
