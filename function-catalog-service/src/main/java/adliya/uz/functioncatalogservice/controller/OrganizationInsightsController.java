package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.EngagementReport;
import adliya.uz.functioncatalogservice.dto.OrganizationSummary;
import adliya.uz.functioncatalogservice.dto.QualityQueue;
import adliya.uz.functioncatalogservice.dto.QualityReminderResponse;
import adliya.uz.functioncatalogservice.entity.FunctionStatus;
import adliya.uz.functioncatalogservice.entity.QualityIssueType;
import adliya.uz.functioncatalogservice.service.EngagementInsightsService;
import adliya.uz.functioncatalogservice.service.OrganizationSummaryService;
import adliya.uz.functioncatalogservice.service.QualityReminderService;
import adliya.uz.functioncatalogservice.service.ServiceQualityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ORG_ANALYTICS_VIEW')")
@Tag(name = "Organization analytics", description = "Organization dashboard data scoped to the caller's organizations. "
        + "Engagement figures describe interest in catalog information only; they are not applications or completed services.")
public class OrganizationInsightsController {

    private final EngagementInsightsService engagement;
    private final OrganizationSummaryService summaries;
    private final ServiceQualityService quality;
    private final QualityReminderService reminders;

    @GetMapping("/summary")
    @Operation(summary = "Dashboard summary",
            description = "Current service status counts and quality issues (a snapshot, not filtered by period), "
                    + "plus visitor report counts for the selected period and the preceding period of equal length.")
    public OrganizationSummary summary(@RequestParam(required = false) Long organizationId,
                                       @RequestParam(required = false) Long categoryId,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return summaries.summary(organizationId, categoryId, from, to);
    }

    @GetMapping("/engagement")
    @Operation(summary = "Catalog engagement for a period",
            description = "Daily aggregates of public catalog views and link clicks in the Asia/Tashkent calendar, "
                    + "compared with the preceding period of equal length.")
    public EngagementReport engagement(@RequestParam(required = false) Long organizationId,
                                       @RequestParam(required = false) Long categoryId,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                       @RequestParam(required = false) EngagementReport.Granularity granularity) {
        return engagement.report(organizationId, categoryId, from, to, granularity);
    }

    @GetMapping("/quality-queue")
    @Operation(summary = "Service cards that need attention",
            description = "Cards with overdue verification, a missing or unusable official source, missing required fields, "
                    + "or missing translations for the active interface languages. Deactivated cards are excluded.")
    public QualityQueue qualityQueue(@RequestParam(required = false) Long organizationId,
                                     @RequestParam(required = false) Long categoryId,
                                     @RequestParam(required = false) QualityIssueType issue,
                                     @RequestParam(required = false) FunctionStatus status) {
        return quality.queue(organizationId, categoryId, issue, status);
    }

    @GetMapping("/reminders")
    @Operation(summary = "Open quality reminders",
            description = "Reminders created by the daily quality scan that nobody has acknowledged yet.")
    public List<QualityReminderResponse> reminders(@RequestParam(required = false) Long organizationId,
                                                   @RequestParam(required = false) Long categoryId) {
        return reminders.active(organizationId, categoryId);
    }

    @PostMapping("/reminders/{id}/acknowledge")
    @Operation(summary = "Acknowledge a reminder",
            description = "Hides the reminder for the organization; it returns after the renotify interval if the issue persists.")
    public ResponseEntity<Void> acknowledge(@PathVariable Long id) {
        reminders.acknowledge(id);
        return ResponseEntity.noContent().build();
    }
}
