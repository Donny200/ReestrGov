package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.dto.CreateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.dto.UpdateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import adliya.uz.functioncatalogservice.security.JwtPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class OrgFunctionService {

    private static final String MANAGE_ANY_ORGANIZATION = "FUNCTIONS_MANAGE_ANY_ORGANIZATION";

    private final OrgFunctionRepository orgFunctionRepository;
    private final OrgFunctionTranslationService translationService;

    public List<OrgFunction> getAll() {
        return orgFunctionRepository.findAllByActiveTrue();
    }

    public OrgFunction getById(Long id) {
        return orgFunctionRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NoSuchElementException("Function not found, ID: " + id));
    }

    public List<OrgFunction> getAllForAdmin() {
        return orgFunctionRepository.findAll();
    }

    public List<OrgFunction> getByOrganizationId(Long organizationId) {
        return orgFunctionRepository.findAllByOrganizationIdAndActiveTrue(organizationId);
    }

    public List<OrgFunction> getByCategory(String category) {
        return orgFunctionRepository.findAllByCategoryAndActiveTrue(category);
    }

    @Transactional
    public OrgFunction create(CreateOrgFunctionRequest request) {
        requireOrganizationAccess(request.organizationId());
        OrgFunction function = OrgFunction.builder()
                .name(request.name())
                .description(request.description())
                .organizationId(request.organizationId())
                .requirements(request.requirements())
                .category(request.category())
                .build();
        return orgFunctionRepository.save(function);
    }

    @Transactional
    public OrgFunction update(Long id, UpdateOrgFunctionRequest request) {
        OrgFunction function = getExistingById(id);
        requireOrganizationAccess(function.getOrganizationId());

        boolean nameChanged = request.name() != null && !request.name().equals(function.getName());
        boolean descriptionChanged = request.description() != null && !request.description().equals(function.getDescription());

        if (nameChanged) {
            function.setName(request.name());
        }
        if (descriptionChanged) {
            function.setDescription(request.description());
        }
        if (request.organizationId() != null && !request.organizationId().equals(function.getOrganizationId())) {
            requireOrganizationAccess(request.organizationId());
            function.setOrganizationId(request.organizationId());
        }
        if (request.requirements() != null) {
            function.setRequirements(request.requirements());
        }
        if (request.category() != null) {
            function.setCategory(request.category());
        }

        translationService.invalidateMachineTranslations(function, nameChanged, descriptionChanged);
        return orgFunctionRepository.save(function);
    }

    @Transactional
    public OrgFunction updateRequirements(Long id, String requirements) {
        OrgFunction function = getExistingById(id);
        requireOrganizationAccess(function.getOrganizationId());
        function.setRequirements(requirements);
        return orgFunctionRepository.save(function);
    }

    @Transactional
    public void deactivate(Long id) {
        OrgFunction function = getExistingById(id);
        requireOrganizationAccess(function.getOrganizationId());
        function.setActive(false);
        orgFunctionRepository.save(function);
    }

    private OrgFunction getExistingById(Long id) {
        return orgFunctionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Function not found, ID: " + id));
    }

    private void requireOrganizationAccess(Long organizationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new AccessDeniedException("Authentication is required");
        }

        boolean hasGlobalAccess = principal.isSuperAdmin()
                || principal.permissions().contains(MANAGE_ANY_ORGANIZATION);

        if (!hasGlobalAccess && !principal.organizationIds().contains(organizationId)) {
            throw new AccessDeniedException(
                    "You can only edit functions within your own organization(s)");
        }
    }
}
