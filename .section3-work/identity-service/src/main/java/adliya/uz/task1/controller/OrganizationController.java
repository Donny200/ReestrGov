package adliya.uz.task1.controller;

import adliya.uz.task1.dto.CreateOrganizationRequest;
import adliya.uz.task1.dto.OrganizationResponse;
import adliya.uz.task1.dto.UpdateOrganizationRequest;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.service.OrganizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<OrganizationResponse> create(@Valid @RequestBody CreateOrganizationRequest request) {
        Organization org = organizationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(OrganizationResponse.from(org));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<OrganizationResponse>> getAll() {
        List<OrganizationResponse> orgs = organizationService.getAll().stream()
                .map(OrganizationResponse::from)
                .toList();
        return ResponseEntity.ok(orgs);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrganizationResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(OrganizationResponse.from(organizationService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<OrganizationResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateOrganizationRequest request) {
        return ResponseEntity.ok(OrganizationResponse.from(organizationService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<String> deactivate(@PathVariable Long id) {
        organizationService.deactivate(id);
        return ResponseEntity.ok("Organization deactivated successfully.");
    }
}
