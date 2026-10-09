package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.ReportQuery;
import adliya.uz.functioncatalogservice.entity.InformationReport;
import adliya.uz.functioncatalogservice.entity.ReportStatus;
import adliya.uz.functioncatalogservice.exception.WorkflowConflictException;
import adliya.uz.functioncatalogservice.repository.InformationReportRepository;
import adliya.uz.functioncatalogservice.security.CatalogAccess;
import adliya.uz.functioncatalogservice.security.JwtPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ReportReviewService {

    public static final int LIST_LIMIT = 500;
    private static final String MANAGE_PERMISSION = "REPORTS_MANAGE";

    private final InformationReportRepository reports;
    private final CatalogAccess access;
    private final AuditWriter audit;

    public List<InformationReport> list(ReportQuery query) {
        JwtPrincipal principal = access.principal();
        boolean global = access.global();
        if (!global && principal.organizationIds().isEmpty()) {
            return List.of();
        }
        Specification<InformationReport> specification = (root, criteria, builder) -> root.get("status").in(query.statuses());
        if (!global) {
            specification = specification.and((root, criteria, builder) -> root.get("organizationId").in(principal.organizationIds()));
        }
        if (query.entityType() != null) {
            specification = specification.and((root, criteria, builder) -> builder.equal(root.get("entityType"), query.entityType()));
        }
        if (query.entityId() != null) {
            specification = specification.and((root, criteria, builder) -> builder.equal(root.get("entityId"), query.entityId()));
        }
        return reports.findAll(specification, PageRequest.of(0, LIST_LIMIT,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))).getContent();
    }

    public InformationReport get(Long id) {
        InformationReport report = reports.findById(id).orElseThrow(() -> new NoSuchElementException("Report not found: " + id));
        access.requireOrganization(report.getOrganizationId());
        return report;
    }

    @Transactional
    public InformationReport changeStatus(Long id, ReportStatus target, String note) {
        access.requirePermission(MANAGE_PERMISSION);
        InformationReport report = get(id);
        ReportStatus previous = report.getStatus();
        if (!previous.canMoveTo(target)) {
            throw new WorkflowConflictException("Report cannot move from " + previous + " to " + target);
        }
        AuditWriter.Actor actor = audit.actor();
        report.setStatus(target);
        report.setHandledByUserId(actor.id());
        report.setUpdatedAt(Instant.now());
        if (note != null && !note.isBlank()) {
            report.setResolutionNote(note.strip());
        }
        if (target.closed()) {
            report.setContact(null);
        }
        reports.saveAndFlush(report);
        audit.reportStatusChanged(report, previous);
        return report;
    }
}
