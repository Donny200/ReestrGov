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

    private final OrgFunctionRepository orgFunctionRepository;
    private final OrgFunctionTranslationService translationService;

    public List<OrgFunction> getAll() {
        return orgFunctionRepository.findAll();
    }

    public OrgFunction getById(Long id) {
        return orgFunctionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Function not found, ID: " + id));
    }

    public List<OrgFunction> getByOrganizationId(Long organizationId) {
        return orgFunctionRepository.findAllByOrganizationId(organizationId);
    }

    public List<OrgFunction> getByCategory(String category) {
        return orgFunctionRepository.findAllByCategory(category);
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
        function = orgFunctionRepository.save(function);
        translationService.translateChangedFields(function, true, request.description() != null);
        return function;
    }

    @Transactional
    public OrgFunction update(Long id, UpdateOrgFunctionRequest request) {
        OrgFunction function = getById(id);
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

        function = orgFunctionRepository.save(function);
        translationService.translateChangedFields(function, nameChanged, descriptionChanged);
        return function;
    }

    @Transactional
    public OrgFunction updateRequirements(Long id, String requirements) {
        OrgFunction function = getById(id);
        requireOrganizationAccess(function.getOrganizationId());
        function.setRequirements(requirements);
        return orgFunctionRepository.save(function);
    }

    public void translateExistingForLanguage(String languageCode) {
        translationService.translateExistingForLanguage(languageCode);
    }

    private void requireOrganizationAccess(Long organizationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        JwtPrincipal principal = (JwtPrincipal) authentication.getPrincipal();

        if (!principal.isSuperAdmin() && !principal.organizationIds().contains(organizationId)) {
            throw new AccessDeniedException(
                    "You can only edit functions within your own organization(s)");
        }
    }
}
