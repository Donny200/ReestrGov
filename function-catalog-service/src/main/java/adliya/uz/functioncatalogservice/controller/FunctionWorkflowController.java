package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.*;
import adliya.uz.functioncatalogservice.service.OrgFunctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/functions") @RequiredArgsConstructor
public class FunctionWorkflowController {
    private final OrgFunctionService service;
    @PostMapping("/{id}/submit-for-review") @PreAuthorize("hasAuthority('FUNCTIONS_SUBMIT_REVIEW')")
    public OrgFunctionResponse submit(@PathVariable Long id) { return OrgFunctionResponse.from(service.submitForReview(id)); }
    @GetMapping("/pending-review") @PreAuthorize("hasAuthority('FUNCTIONS_REVIEW')")
    public List<OrgFunctionResponse> queue() { return service.pendingReview().stream().map(OrgFunctionResponse::from).toList(); }
    @PostMapping("/{id}/reject") @PreAuthorize("hasAuthority('FUNCTIONS_REVIEW')")
    public OrgFunctionResponse reject(@PathVariable Long id, @Valid @RequestBody RejectFunctionRequest request) {
        return OrgFunctionResponse.from(service.reject(id, request.reason()));
    }
    @PostMapping("/{id}/publish") @PreAuthorize("hasAuthority('FUNCTIONS_PUBLISH')")
    public OrgFunctionResponse publish(@PathVariable Long id) { return OrgFunctionResponse.from(service.publish(id)); }
    @PostMapping("/{id}/reactivate") @PreAuthorize("hasAuthority('FUNCTIONS_REACTIVATE')")
    public OrgFunctionResponse reactivate(@PathVariable Long id) { return OrgFunctionResponse.from(service.reactivate(id)); }
    @GetMapping("/{id}/audit") @PreAuthorize("hasAuthority('AUDIT_VIEW')")
    public List<AuditLogResponse> audit(@PathVariable Long id) { return service.history(id); }
    @PutMapping("/{id}/translations")
    @PreAuthorize("hasAuthority('FUNCTIONS_EDIT') and hasAuthority('FUNCTIONS_TRANSLATIONS_EDIT')")
    public OrgFunctionResponse translations(@PathVariable Long id, @Valid @RequestBody FunctionTranslationsRequest request) {
        return OrgFunctionResponse.from(service.updateTranslations(id, request));
    }
}
