import { apiDownload, apiRequest } from './http';
import type { CsvDelimiter } from '../types/analytics';
import type { InformationReport, ReportHistoryEntry, ReportQuery, ReportStatus, SubmitReportRequest } from '../types/reports';

export const submitReport = (body: SubmitReportRequest) =>
  apiRequest<{ received: boolean }>('/api/reports', { method: 'POST', body, skipRefresh: true, skipUnauthorizedHandler: true });

export const getReports = (query: ReportQuery) => apiRequest<InformationReport[]>('/api/reports', { query: { ...query } });

export const getReport = (id: number) => apiRequest<InformationReport>(`/api/reports/${id}`);

export const getReportHistory = (id: number) => apiRequest<ReportHistoryEntry[]>(`/api/reports/${id}/history`);

export const updateReportStatus = (id: number, status: ReportStatus, note: string) =>
  apiRequest<InformationReport>(`/api/reports/${id}/status`, { method: 'PUT', body: { status, note } });

export const exportReports = (query: ReportQuery, delimiter: CsvDelimiter) =>
  apiDownload('/api/reports/export', { ...query, delimiter });
