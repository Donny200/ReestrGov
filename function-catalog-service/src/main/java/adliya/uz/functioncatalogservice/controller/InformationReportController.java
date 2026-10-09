package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.AuditLogResponse;
import adliya.uz.functioncatalogservice.dto.ReportQuery;
import adliya.uz.functioncatalogservice.dto.ReportResponse;
import adliya.uz.functioncatalogservice.dto.SubmitReportRequest;
import adliya.uz.functioncatalogservice.dto.UpdateReportStatusRequest;
import adliya.uz.functioncatalogservice.entity.InformationReport;
import adliya.uz.functioncatalogservice.entity.ReportCategory;
import adliya.uz.functioncatalogservice.entity.ReportEntityType;
import adliya.uz.functioncatalogservice.service.AnalyticsExportService;
import adliya.uz.functioncatalogservice.service.ClientAddressResolver;
import adliya.uz.functioncatalogservice.service.CsvExport;
import adliya.uz.functioncatalogservice.service.ReportReviewService;
import adliya.uz.functioncatalogservice.service.ReportSubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class InformationReportController {

    static final String VIEW = "hasAnyAuthority('REPORTS_VIEW', 'ORG_REPORTS_MANAGE')";
    static final String MANAGE = "hasAuthority('ORG_REPORTS_MANAGE') or (hasAuthority('REPORTS_VIEW') and hasAuthority('REPORTS_MANAGE'))";

    private final ReportSubmissionService submissions;
    private final ReportReviewService reviews;
    private final ClientAddressResolver clientAddresses;
    private final AnalyticsExportService exports;

    @PostMapping
    public ResponseEntity<Map<String, Boolean>> submit(@Valid @RequestBody SubmitReportRequest request, HttpServletRequest http) {
        submissions.submit(request, clientAddresses.resolve(http));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("received", true));
    }

    @GetMapping
    @PreAuthorize(VIEW)
    public List<ReportResponse> list(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) ReportCategory category,
                                     @RequestParam(required = false) ReportEntityType entityType,
                                     @RequestParam(required = false) Long entityId,
                                     @RequestParam(required = false) Long serviceCategoryId,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                     @RequestParam(required = false) Long organizationId) {
        ReportQuery query = new ReportQuery(ReportQuery.statuses(status), category, entityType, entityId, serviceCategoryId,
                from, to, organizationId);
        boolean reveal = reviews.revealsContact();
        return reviews.list(query).stream().map(report -> ReportResponse.of(report, reveal, null)).toList();
    }

    @GetMapping("/export")
    @PreAuthorize(VIEW)
    public ResponseEntity<byte[]> export(@RequestParam(required = false) String status,
                                         @RequestParam(required = false) ReportCategory category,
                                         @RequestParam(required = false) ReportEntityType entityType,
                                         @RequestParam(required = false) Long entityId,
                                         @RequestParam(required = false) Long serviceCategoryId,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                         @RequestParam(required = false) Long organizationId,
                                         @RequestParam(defaultValue = "COMMA") CsvExport.Delimiter delimiter) {
        ReportQuery query = new ReportQuery(ReportQuery.statuses(status), category, entityType, entityId, serviceCategoryId,
                from, to, organizationId);
        return CsvExport.attachment(exports.reports(query, delimiter));
    }

    @GetMapping("/{id}")
    @PreAuthorize(VIEW)
    public ReportResponse get(@PathVariable Long id) {
        InformationReport report = reviews.get(id);
        return ReportResponse.of(report, reviews.revealsContact(), reviews.serviceChangedSince(report));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize(VIEW)
    public List<AuditLogResponse> history(@PathVariable Long id) {
        return reviews.history(id).stream().map(AuditLogResponse::from).toList();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize(MANAGE)
    public ReportResponse changeStatus(@PathVariable Long id, @Valid @RequestBody UpdateReportStatusRequest request) {
        InformationReport report = reviews.changeStatus(id, request.status(), request.note());
        return ReportResponse.of(report, true, reviews.serviceChangedSince(report));
    }
}
