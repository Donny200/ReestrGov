package adliya.uz.functioncatalogservice.dto;

import adliya.uz.functioncatalogservice.entity.FunctionStatus;
import adliya.uz.functioncatalogservice.entity.QualityIssueType;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record OrganizationSummary(Instant generatedAt, EngagementReport.PeriodInfo period, Long organizationId, Long categoryId,
                                  Map<FunctionStatus, Long> services, long servicesNeedingAttention,
                                  Map<QualityIssueType, Long> attention, boolean translationsChecked,
                                  List<String> activeLanguages, ReportCounts reports, long openReminders) {

    public record ReportCounts(long unresolved, long newReports, long inProgress,
                               long receivedInPeriod, long receivedInPreviousPeriod) {}
}
