package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.*;
import adliya.uz.functioncatalogservice.repository.AuditLogRepository;
import adliya.uz.functioncatalogservice.security.CatalogAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class AuditWriter {
    public static final String REPORT_ENTITY = "INFORMATION_REPORT";
    private final AuditLogRepository repository;
    private final CatalogAccess access;

    public Actor actor() {
        var principal = access.principal();
        if (principal.userId() == null || principal.userId() <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Refresh your session to obtain an identity-service token with userId");
        }
        return new Actor(principal.userId(), principal.email());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void function(OrgFunction function, AuditAction action, String details) {
        write("FUNCTION", function.getId(), action, details, actor(), Set.of(function.getId()));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void category(Long id, AuditAction action, String details) {
        write("FUNCTION_CATEGORY", id, action, details, actor(), Set.of());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long startImport(Actor actor) {
        var log = AuditLog.builder().entityType("FUNCTION_IMPORT").action(AuditAction.IMPORT)
                .performedByUserId(actor.id()).performedBy(actor.email()).performedAt(Instant.now())
                .details("Import in progress; success=0; errors=0").build();
        return repository.saveAndFlush(log).getId();
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void addImported(Long auditId, Long functionId) {
        var log = repository.findById(auditId).orElseThrow();
        log.getAffectedFunctionIds().add(functionId);
        log.setDetails("Import in progress; success=" + log.getAffectedFunctionIds().size());
        repository.save(log);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishImport(Long auditId, int errors) {
        var log = repository.findById(auditId).orElseThrow();
        log.setDetails("success=" + log.getAffectedFunctionIds().size() + "; errors=" + errors
                + "; functionIds=" + log.getAffectedFunctionIds());
        repository.save(log);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void seeded(OrgFunction function) {
        write("FUNCTION", function.getId(), AuditAction.CREATE,
                "Editorial seed " + function.getSeedKey() + "; DRAFT; organization unassigned",
                new Actor(null, "system:editorial-seed"), Set.of(function.getId()));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void seedTranslations(OrgFunction function) {
        write("FUNCTION", function.getId(), AuditAction.TRANSLATION_EDIT,
                "Generated missing en/uz translations through Azure Translator",
                new Actor(null, "system:editorial-seed"), Set.of(function.getId()));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void reportReceived(InformationReport report) {
        write(REPORT_ENTITY, report.getId(), AuditAction.REPORT_RECEIVED,
                report.getEntityType() + " #" + report.getEntityId() + "; category=" + report.getCategory(),
                new Actor(null, "public:anonymous"), relatedFunctions(report));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void reportStatusChanged(InformationReport report, ReportStatus previous, String explanation) {
        String transition = "Report #" + report.getId() + ": " + previous + " -> " + report.getStatus();
        write(REPORT_ENTITY, report.getId(), AuditAction.REPORT_STATUS_CHANGE,
                explanation == null ? transition : transition + "\n" + explanation, actor(), relatedFunctions(report));
    }

    private static Set<Long> relatedFunctions(InformationReport report) {
        return report.getEntityType() == ReportEntityType.FUNCTION ? Set.of(report.getEntityId()) : Set.of();
    }

    private void write(String type, Long id, AuditAction action, String details, Actor actor, Set<Long> ids) {
        repository.save(AuditLog.builder().entityType(type).entityId(id).action(action)
                .performedByUserId(actor.id()).performedBy(actor.email()).performedAt(Instant.now())
                .details(details).affectedFunctionIds(ids).build());
    }
    public record Actor(Long id, String email) {}
}
