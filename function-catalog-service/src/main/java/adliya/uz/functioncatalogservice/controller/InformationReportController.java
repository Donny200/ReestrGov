package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.config.ReportProperties;
import adliya.uz.functioncatalogservice.dto.ReportQuery;
import adliya.uz.functioncatalogservice.dto.ReportResponse;
import adliya.uz.functioncatalogservice.dto.SubmitReportRequest;
import adliya.uz.functioncatalogservice.dto.UpdateReportStatusRequest;
import adliya.uz.functioncatalogservice.entity.ReportEntityType;
import adliya.uz.functioncatalogservice.service.ReportReviewService;
import adliya.uz.functioncatalogservice.service.ReportSubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class InformationReportController {

    private final ReportSubmissionService submissions;
    private final ReportReviewService reviews;
    private final ReportProperties properties;

    @PostMapping
    public ResponseEntity<Map<String, Boolean>> submit(@Valid @RequestBody SubmitReportRequest request, HttpServletRequest http) {
        submissions.submit(request, clientAddress(http));
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("received", true));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('REPORTS_VIEW')")
    public List<ReportResponse> list(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) ReportEntityType entityType,
                                     @RequestParam(required = false) Long entityId) {
        return reviews.list(ReportQuery.of(status, entityType, entityId)).stream().map(ReportResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('REPORTS_VIEW')")
    public ReportResponse get(@PathVariable Long id) {
        return ReportResponse.from(reviews.get(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('REPORTS_VIEW') and hasAuthority('REPORTS_MANAGE')")
    public ReportResponse changeStatus(@PathVariable Long id, @Valid @RequestBody UpdateReportStatusRequest request) {
        return ReportResponse.from(reviews.changeStatus(id, request.status(), request.note()));
    }

    private String clientAddress(HttpServletRequest request) {
        String header = request.getHeader(properties.getClientAddressHeader());
        return StringUtils.hasText(header) ? header.trim() : request.getRemoteAddr();
    }
}
