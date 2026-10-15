package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.CreateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.dto.MachineTranslationSummary;
import adliya.uz.functioncatalogservice.service.MachineTranslationQueue;
import adliya.uz.functioncatalogservice.dto.OrgFunctionResponse;
import adliya.uz.functioncatalogservice.dto.PublicChangeResponse;
import adliya.uz.functioncatalogservice.service.PublicChangeService;
import adliya.uz.functioncatalogservice.dto.UpdateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.dto.UpdateRequirementsRequest;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.service.OrgFunctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/functions")
@RequiredArgsConstructor
public class OrgFunctionController {

    private final OrgFunctionService orgFunctionService;
    private final PublicChangeService publicChanges;
    private final MachineTranslationQueue translations;

    @GetMapping
    public ResponseEntity<List<OrgFunctionResponse>> getAll(
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) String category) {
        List<OrgFunction> functions;
        if (organizationId != null) {
            functions = orgFunctionService.getByOrganizationId(organizationId);
        } else if (category != null) {
            functions = orgFunctionService.getByCategory(category);
        } else {
            functions = orgFunctionService.getAll();
        }
        Map<Long, java.time.Instant> updated = publicChanges.lastUpdatedAt(functions.stream().map(OrgFunction::getId).toList());
        return ResponseEntity.ok(functions.stream().map(function -> OrgFunctionResponse.publicFrom(function, updated.get(function.getId()))).toList());
    }

    /** Public, concise history of approved publications of a published card; nothing about drafts or staff. */
    @GetMapping("/{id}/history")
    public List<PublicChangeResponse> publicHistory(@PathVariable Long id) {
        return publicChanges.publicHistory(id).stream().map(PublicChangeResponse::from).toList();
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('FUNCTIONS_VIEW')")
    public ResponseEntity<List<OrgFunctionResponse>> getAllForAdmin() {
        List<OrgFunction> functions = orgFunctionService.getAllForAdmin();
        Map<Long, OrgFunction> revisions = orgFunctionService.draftRevisionsOf(functions);
        Map<Long, MachineTranslationSummary> summaries = translations.summaries(functions);
        return ResponseEntity.ok(functions.stream()
                .map(function -> OrgFunctionResponse.from(function, revisions.get(function.getId()))
                        .withMachineTranslation(summaries.get(function.getId())))
                .toList());
    }

    @GetMapping("/{id}/admin")
    @PreAuthorize("hasAuthority('FUNCTIONS_VIEW')")
    public OrgFunctionResponse getForAdmin(@PathVariable Long id) {
        OrgFunction function = orgFunctionService.getForAdmin(id);
        return OrgFunctionResponse.from(function, orgFunctionService.draftRevisionsOf(List.of(function)).get(function.getId()))
                .withMachineTranslation(translations.summary(function));
    }

    /** Opens (or returns) the draft revision through which a published card is edited; the public version stays as is. */
    @PostMapping("/{id}/revisions")
    @PreAuthorize("hasAuthority('FUNCTIONS_EDIT')")
    public ResponseEntity<OrgFunctionResponse> createRevision(@PathVariable Long id) {
        return ResponseEntity.ok(OrgFunctionResponse.from(orgFunctionService.createRevision(id)));
    }

    @DeleteMapping("/{id}/revision")
    @PreAuthorize("hasAuthority('FUNCTIONS_EDIT')")
    public ResponseEntity<Void> discardRevision(@PathVariable Long id) {
        orgFunctionService.discardRevision(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrgFunctionResponse> getById(@PathVariable Long id) {
        OrgFunction function = orgFunctionService.getById(id);
        return ResponseEntity.ok(OrgFunctionResponse.publicFrom(function, publicChanges.lastUpdatedAt(List.of(function.getId())).get(function.getId())));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('FUNCTIONS_CREATE')")
    public ResponseEntity<OrgFunctionResponse> create(@Valid @RequestBody CreateOrgFunctionRequest request) {
        OrgFunction function = orgFunctionService.create(request);
        return ResponseEntity.status(201).body(OrgFunctionResponse.from(function).withMachineTranslation(translations.summary(function)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('FUNCTIONS_EDIT')")
    public ResponseEntity<OrgFunctionResponse> update(
            @PathVariable Long id, @Valid @RequestBody UpdateOrgFunctionRequest request) {
        OrgFunction function = orgFunctionService.update(id, request);
        return ResponseEntity.ok(OrgFunctionResponse.from(function).withMachineTranslation(translations.summary(function)));
    }

    @PutMapping("/{id}/requirements")
    @PreAuthorize("hasAuthority('FUNCTIONS_MANAGE_REQUIREMENTS')")
    public ResponseEntity<OrgFunctionResponse> updateRequirements(
            @PathVariable Long id, @Valid @RequestBody UpdateRequirementsRequest request) {
        return ResponseEntity.ok(OrgFunctionResponse.from(orgFunctionService.updateRequirements(id, request.requirements())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('FUNCTIONS_DEACTIVATE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        orgFunctionService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
