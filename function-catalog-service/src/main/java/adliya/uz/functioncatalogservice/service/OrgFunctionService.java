package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.*;
import adliya.uz.functioncatalogservice.entity.*;
import adliya.uz.functioncatalogservice.exception.WorkflowConflictException;
import adliya.uz.functioncatalogservice.repository.*;
import adliya.uz.functioncatalogservice.security.CatalogAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static adliya.uz.functioncatalogservice.entity.FunctionStatus.*;

@Service @RequiredArgsConstructor
public class OrgFunctionService {
    private final OrgFunctionRepository orgFunctionRepository;
    private final OrgFunctionTranslationService translationService;
    private final FunctionCategoryService categories;
    private final CatalogAccess access;
    private final AuditWriter audit;
    private final AuditLogRepository auditLogs;
    private final IdentityOrganizationClient organizations;

    public List<OrgFunction> getAll() { return orgFunctionRepository.findAllByStatus(PUBLISHED); }
    public OrgFunction getById(Long id) {
        return orgFunctionRepository.findByIdAndStatus(id, PUBLISHED)
                .orElseThrow(() -> new NoSuchElementException("Function not found, ID: " + id));
    }
    public List<OrgFunction> getByOrganizationId(Long id) {
        return orgFunctionRepository.findAllByOrganizationIdAndStatus(id, PUBLISHED);
    }
    public List<OrgFunction> getByCategory(String category) {
        return orgFunctionRepository.findAllByFunctionCategory_NameAndStatus(category, PUBLISHED);
    }
    public List<OrgFunction> getAllForAdmin() {
        return access.global() ? orgFunctionRepository.findAll()
                : orgFunctionRepository.findAllByOrganizationIdIn(access.principal().organizationIds());
    }
    public List<OrgFunction> pendingReview() {
        return access.global() ? orgFunctionRepository.findAllByStatus(PENDING_REVIEW)
                : orgFunctionRepository.findAllByStatusAndOrganizationIdIn(PENDING_REVIEW, access.principal().organizationIds());
    }
    public List<AuditLogResponse> history(Long id) {
        scoped(id);
        boolean global = access.global();
        return auditLogs.findFunctionHistory(id).stream().map(log -> {
            var response = AuditLogResponse.from(log);
            if (log.getAction() == AuditAction.IMPORT && !global) {
                // A global import may span organizations; do not expose its other card IDs/counts.
                return new AuditLogResponse(response.id(), response.performedByUserId(), response.performedBy(),
                        response.action(), response.performedAt(), "Imported this function as DRAFT");
            }
            return response;
        }).toList();
    }

    @Transactional
    public OrgFunction create(CreateOrgFunctionRequest request) {
        var function = newDraft(request);
        orgFunctionRepository.saveAndFlush(function);
        audit.function(function, AuditAction.CREATE, "Draft created");
        return function;
    }

    // Used by the import row transaction; the batch owns its single IMPORT audit event.
    public OrgFunction newDraft(CreateOrgFunctionRequest request) {
        access.requireOrganization(request.organizationId());
        if (request.organizationId() != null) organizations.requireExisting(request.organizationId());
        return OrgFunction.builder().name(request.name()).description(request.description())
                .organizationId(request.organizationId()).requirements(request.requirements())
                .functionCategory(categories.resolve(request.categoryId(), request.category()))
                .sourceLanguage(request.sourceLanguage() == null ? "en" : request.sourceLanguage().toLowerCase(Locale.ROOT))
                .status(DRAFT).build();
    }

    @Transactional
    public OrgFunction update(Long id, UpdateOrgFunctionRequest request) {
        var function = scoped(id);
        requireEditable(function);
        var changed = new ArrayList<String>();
        boolean nameChanged = request.name() != null && !request.name().equals(function.getName());
        boolean descriptionChanged = request.description() != null && !request.description().equals(function.getDescription());
        if (nameChanged) { function.setName(request.name()); changed.add("name"); }
        if (descriptionChanged) { function.setDescription(request.description()); changed.add("description"); }
        if (request.organizationId() != null && !request.organizationId().equals(function.getOrganizationId())) {
            access.requireOrganization(request.organizationId());
            organizations.requireExisting(request.organizationId());
            function.setOrganizationId(request.organizationId());
            changed.add("organizationId");
        }
        if (request.requirements() != null && !request.requirements().equals(function.getRequirements())) {
            function.setRequirements(request.requirements()); changed.add("requirements");
        }
        if (request.categoryId() != null || request.category() != null) {
            var category = categories.resolve(request.categoryId(), request.category());
            Long oldId = function.getFunctionCategory() == null ? null : function.getFunctionCategory().getId();
            Long newId = category == null ? null : category.getId();
            if (!Objects.equals(oldId, newId)) {
                function.setFunctionCategory(category);
                audit.function(function, AuditAction.CATEGORY_CHANGE, "categoryId: " + oldId + " -> " + newId);
            }
        }
        translationService.invalidateMachineTranslations(function, nameChanged, descriptionChanged);
        if (!changed.isEmpty()) audit.function(function, AuditAction.UPDATE, "Changed fields: " + String.join(", ", changed));
        return orgFunctionRepository.saveAndFlush(function);
    }

    @Transactional
    public OrgFunction updateRequirements(Long id, String requirements) {
        var function = scoped(id);
        requireEditable(function);
        if (!Objects.equals(requirements, function.getRequirements())) {
            function.setRequirements(requirements);
            audit.function(function, AuditAction.UPDATE, "Changed fields: requirements");
        }
        return orgFunctionRepository.saveAndFlush(function);
    }

    @Transactional
    public OrgFunction updateTranslations(Long id, FunctionTranslationsRequest request) {
        access.requirePermission("FUNCTIONS_EDIT");
        access.requirePermission("FUNCTIONS_TRANSLATIONS_EDIT");
        var function = scoped(id);
        requireEditable(function);
        if (request.nameTranslations() == null && request.descriptionTranslations() == null) {
            throw new IllegalArgumentException("At least one translation field is required");
        }
        var changed = new ArrayList<String>();
        if (request.nameTranslations() != null) {
            var values = humanTranslations(request.nameTranslations());
            if (!values.equals(function.getNameTranslations())) { function.setNameTranslations(values); changed.add("nameTranslations"); }
        }
        if (request.descriptionTranslations() != null) {
            var values = humanTranslations(request.descriptionTranslations());
            if (!values.equals(function.getDescriptionTranslations())) { function.setDescriptionTranslations(values); changed.add("descriptionTranslations"); }
        }
        if (!changed.isEmpty()) audit.function(function, AuditAction.TRANSLATION_EDIT, "Replaced fields: " + String.join(", ", changed));
        return orgFunctionRepository.saveAndFlush(function);
    }

    @Transactional public OrgFunction submitForReview(Long id) {
        return transition(id, DRAFT, PENDING_REVIEW, AuditAction.SUBMIT_REVIEW, null);
    }
    @Transactional public OrgFunction reject(Long id, String reason) {
        if (reason == null || reason.isBlank() || reason.length() > 2000) throw new IllegalArgumentException("A rejection reason of 1-2000 characters is required");
        return transition(id, PENDING_REVIEW, DRAFT, AuditAction.REJECT, reason);
    }
    @Transactional public OrgFunction publish(Long id) {
        return transition(id, PENDING_REVIEW, PUBLISHED, AuditAction.PUBLISH, null);
    }
    @Transactional public OrgFunction reactivate(Long id) {
        return transition(id, DEACTIVATED, PENDING_REVIEW, AuditAction.REACTIVATE, null);
    }
    @Transactional public void deactivate(Long id) {
        transition(id, PUBLISHED, DEACTIVATED, AuditAction.DEACTIVATE, null);
    }

    private OrgFunction transition(Long id, FunctionStatus from, FunctionStatus to, AuditAction action, String reason) {
        var function = scoped(id);
        if (function.getStatus() != from) throw new WorkflowConflictException(
                "Expected " + from + ", found " + function.getStatus() + "; cannot transition to " + to);
        if (to == PENDING_REVIEW || to == PUBLISHED) organizations.requireExisting(function.getOrganizationId());
        function.setStatus(to);
        orgFunctionRepository.saveAndFlush(function);
        audit.function(function, action, reason == null ? from + " -> " + to : reason);
        return function;
    }

    private OrgFunction scoped(Long id) {
        var function = orgFunctionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Function not found, ID: " + id));
        access.requireOrganization(function.getOrganizationId());
        return function;
    }

    private void requireEditable(OrgFunction function) {
        if (function.getStatus() != DRAFT && function.getStatus() != DEACTIVATED) {
            throw new WorkflowConflictException("Editing requires DRAFT or DEACTIVATED; reject/deactivate the card first");
        }
    }
    private Map<String, TranslatedText> humanTranslations(Map<String, String> values) {
        Map<String, TranslatedText> result = new LinkedHashMap<>();
        values.forEach((code, text) -> result.put(code, new TranslatedText(text, TranslatedText.HUMAN)));
        return result;
    }
}
