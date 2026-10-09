import { apiDownload, apiRequest } from './http';
import type {
  AnalyticsFilters,
  CsvDelimiter,
  EngagementEvent,
  EngagementReport,
  OrganizationSummary,
  QualityQueue,
  QualityQueueFilters,
  QualityReminderPage,
} from '../types/analytics';

export const recordEngagement = (event: EngagementEvent) =>
  apiRequest<void>('/api/analytics/events', { method: 'POST', body: event, skipRefresh: true, skipUnauthorizedHandler: true });

export const getOrganizationSummary = (filters: AnalyticsFilters) =>
  apiRequest<OrganizationSummary>('/api/analytics/summary', { query: { ...filters } });

export const getEngagement = (filters: AnalyticsFilters) =>
  apiRequest<EngagementReport>('/api/analytics/engagement', { query: { ...filters } });

export const getQualityQueue = (filters: QualityQueueFilters) =>
  apiRequest<QualityQueue>('/api/analytics/quality-queue', { query: { ...filters } });

export const getReminders = (filters: Pick<AnalyticsFilters, 'organizationId' | 'categoryId'>) =>
  apiRequest<QualityReminderPage>('/api/analytics/reminders', { query: { ...filters } });

export const acknowledgeReminder = (id: number) =>
  apiRequest<void>(`/api/analytics/reminders/${id}/acknowledge`, { method: 'POST' });

export const exportEngagement = (filters: AnalyticsFilters, breakdown: 'SERVICES' | 'DAILY', delimiter: CsvDelimiter) =>
  apiDownload('/api/analytics/engagement/export', { ...filters, breakdown, delimiter });

export const exportQualityQueue = (filters: QualityQueueFilters, delimiter: CsvDelimiter) =>
  apiDownload('/api/analytics/quality-queue/export', { ...filters, delimiter });
