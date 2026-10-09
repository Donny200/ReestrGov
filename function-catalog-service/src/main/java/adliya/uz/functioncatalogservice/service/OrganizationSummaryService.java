package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.OrganizationSummary;
import adliya.uz.functioncatalogservice.dto.ReportingPeriod;
import adliya.uz.functioncatalogservice.security.CatalogAccess;
import adliya.uz.functioncatalogservice.security.OrganizationScope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationSummaryService {

    private final CatalogAccess access;
    private final ServiceQualityService quality;
    private final ReportReviewService reports;
    private final QualityReminderService reminders;
    private final EngagementInsightsService engagement;

    public OrganizationSummary summary(Long organizationId, Long categoryId, LocalDate from, LocalDate to) {
        OrganizationScope scope = access.scope(organizationId);
        ReportingPeriod period = engagement.period(from, to);
        ServiceQualityService.Snapshot snapshot = quality.snapshot(scope, categoryId);
        return new OrganizationSummary(Instant.now(), engagement.periodInfo(period), organizationId, categoryId,
                snapshot.statuses(), snapshot.servicesNeedingAttention(), snapshot.attention(),
                snapshot.translationsChecked(), snapshot.activeLanguages(),
                reports.counts(scope, categoryId, period),
                reminders.activeCount(scope, snapshot.functionIds()));
    }
}
