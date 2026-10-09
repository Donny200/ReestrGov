import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getReports, submitReport, updateReportStatus } from '../../services/reportService';
import type { ReportQuery, ReportStatus, SubmitReportRequest } from '../../types/reports';
import { reportKeys } from '../queryKeys';

export const useReports = (query: ReportQuery, enabled = true) =>
  useQuery({ queryKey: reportKeys.list(query), queryFn: () => getReports(query), enabled });

export const useSubmitReport = () => useMutation({ mutationFn: (body: SubmitReportRequest) => submitReport(body) });

export function useUpdateReportStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: ReportStatus; note: string }) => updateReportStatus(id, status, note),
    onSuccess: () => client.invalidateQueries({ queryKey: reportKeys.all }),
  });
}
