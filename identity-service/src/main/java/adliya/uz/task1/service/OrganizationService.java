package adliya.uz.task1.service;

import adliya.uz.task1.dto.CreateOrganizationRequest;
import adliya.uz.task1.dto.UpdateOrganizationRequest;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.OrganizationAlreadyExistsException;
import adliya.uz.task1.exception.OrganizationHasActiveMembersException;
import adliya.uz.task1.exception.ResourceNotFoundException;
import adliya.uz.task1.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private static final String ORGANIZATIONS_CREATE = "ORGANIZATIONS_CREATE";
    private static final String ORGANIZATIONS_EDIT = "ORGANIZATIONS_EDIT";
    private static final String ORGANIZATIONS_EDIT_OWN = "ORGANIZATIONS_EDIT_OWN";
    private static final String ORGANIZATIONS_DEACTIVATE = "ORGANIZATIONS_DEACTIVATE";
    private static final String ORGANIZATIONS_REACTIVATE = "ORGANIZATIONS_REACTIVATE";

    private final OrganizationRepository organizationRepository;
    private final OrganizationTranslationStateService translationStateService;
    private final UserService userService;

    @Transactional
    public Organization create(CreateOrganizationRequest request) {
        requirePermission(ORGANIZATIONS_CREATE);
        if (organizationRepository.existsByName(request.getName())) {
            throw new OrganizationAlreadyExistsException(
                    "Organization already exists with name: " + request.getName());
        }

        Organization org = Organization.builder()
                .name(request.getName())
                .description(request.getDescription())
                .enabled(true)
                .build();

        translationStateService.invalidateMachineTranslations(org, true, request.getDescription() != null);
        return organizationRepository.save(org);
    }

    public Organization getById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found, ID: " + id));
    }

    public List<Organization> getAll() {
        return organizationRepository.findAll();
    }

    @Transactional
    public Organization update(Long id, UpdateOrganizationRequest request) {
        requireUpdateAccess(id);
        Organization org = getById(id);

        boolean nameChanged = request.getName() != null && !request.getName().equals(org.getName());
        boolean descriptionChanged = request.getDescription() != null
                && !Objects.equals(request.getDescription(), org.getDescription());

        if (nameChanged) {
            if (organizationRepository.existsByName(request.getName())) {
                throw new OrganizationAlreadyExistsException(
                        "Organization already exists with name: " + request.getName());
            }
            org.setName(request.getName());
        }

        if (descriptionChanged) {
            org.setDescription(request.getDescription());
        }

        translationStateService.invalidateMachineTranslations(org, nameChanged, descriptionChanged);
        return organizationRepository.save(org);
    }

    @Transactional
    public void deactivate(Long id) {
        requirePermission(ORGANIZATIONS_DEACTIVATE);
        Organization org = getById(id);

        boolean hasActiveStaff = org.getMembers().stream()
                .anyMatch(u -> Boolean.TRUE.equals(u.getEnabled())
                        && ("ROLE_ORG_ADMIN".equals(u.getRole().getName())
                        || "ROLE_MODERATOR".equals(u.getRole().getName())));

        if (hasActiveStaff) {
            throw new OrganizationHasActiveMembersException(
                    "Cannot deactivate organization while it still has an active org admin or moderator assigned. " +
                            "Reassign or deactivate them first.");
        }

        org.setEnabled(false);
        organizationRepository.save(org);
    }

    @Transactional
    public Organization reactivate(Long id) {
        requirePermission(ORGANIZATIONS_REACTIVATE);
        Organization organization = getById(id);
        organization.setEnabled(true);
        return organizationRepository.save(organization);
    }

    public List<Organization> getAllPublic() {
        return organizationRepository.findAllByEnabledTrue();
    }

    public Organization getPublicById(Long id) {
        Organization org = getById(id);
        if (!Boolean.TRUE.equals(org.getEnabled())) {
            throw new ResourceNotFoundException("Organization not found, ID: " + id);
        }
        return org;
    }

    private void requireUpdateAccess(Long organizationId) {
        User current = requireEnabledUser();
        if (hasPermission(current, ORGANIZATIONS_EDIT)) {
            return;
        }

        boolean canEditOwn = hasPermission(current, ORGANIZATIONS_EDIT_OWN)
                && current.getOrganizations().stream()
                .map(Organization::getId)
                .anyMatch(organizationId::equals);
        if (!canEditOwn) {
            throw new AccessDeniedException("You can only edit your own organization");
        }
    }

    private User requirePermission(String permissionCode) {
        User current = requireEnabledUser();
        if (!hasPermission(current, permissionCode)) {
            throw new AccessDeniedException("Missing required permission: " + permissionCode);
        }
        return current;
    }

    private User requireEnabledUser() {
        User current = userService.getCurrentUser();
        if (!Boolean.TRUE.equals(current.getEnabled()) || current.getRole() == null) {
            throw new AccessDeniedException("An enabled user with an assigned role is required");
        }
        return current;
    }

    private boolean hasPermission(User user, String permissionCode) {
        return user.getRole().getPermissions().stream()
                .anyMatch(permission -> permissionCode.equals(permission.getCode()));
    }
}
