package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.CreateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.dto.OrgFunctionResponse;
import adliya.uz.functioncatalogservice.dto.UpdateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.dto.UpdateRequirementsRequest;
import adliya.uz.functioncatalogservice.service.OrgFunctionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/functions")
@RequiredArgsConstructor
public class OrgFunctionController {

    private final OrgFunctionService orgFunctionService;

    @GetMapping
    public ResponseEntity<List<OrgFunctionResponse>> getAll(
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) String category) {
        if (organizationId != null) {
            return ResponseEntity.ok(orgFunctionService.getByOrganizationId(organizationId).stream().map(OrgFunctionResponse::from).toList());
        }
        if (category != null) {
            return ResponseEntity.ok(orgFunctionService.getByCategory(category).stream().map(OrgFunctionResponse::from).toList());
        }
        return ResponseEntity.ok(orgFunctionService.getAll().stream().map(OrgFunctionResponse::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrgFunctionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(OrgFunctionResponse.from(orgFunctionService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    public ResponseEntity<OrgFunctionResponse> create(@Valid @RequestBody CreateOrgFunctionRequest request) {
        return ResponseEntity.status(201).body(OrgFunctionResponse.from(orgFunctionService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    public ResponseEntity<OrgFunctionResponse> update(
            @PathVariable Long id, @Valid @RequestBody UpdateOrgFunctionRequest request) {
        return ResponseEntity.ok(OrgFunctionResponse.from(orgFunctionService.update(id, request)));
    }

    @PutMapping("/{id}/requirements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ORG_ADMIN')")
    public ResponseEntity<OrgFunctionResponse> updateRequirements(
            @PathVariable Long id, @Valid @RequestBody UpdateRequirementsRequest request) {
        return ResponseEntity.ok(OrgFunctionResponse.from(orgFunctionService.updateRequirements(id, request.getRequirements())));
    }
}
