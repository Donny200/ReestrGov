package adliya.uz.task1.service;

import adliya.uz.task1.dto.CreateOrganizationRequest;
import adliya.uz.task1.dto.UpdateOrganizationRequest;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.exception.OrganizationAlreadyExistsException;
import adliya.uz.task1.exception.OrganizationHasActiveMembersException;
import adliya.uz.task1.exception.ResourceNotFoundException;
import adliya.uz.task1.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationTranslationService translationService;
    private final SessionRevocationService sessionRevocationService;

    @Transactional
    public Organization create(CreateOrganizationRequest request) {
        if (organizationRepository.existsByName(request.getName())) {
            throw new OrganizationAlreadyExistsException(
                    "Organization already exists with name: " + request.getName());
        }

        Organization org = Organization.builder()
                .name(request.getName())
                .description(request.getDescription())
                .enabled(true)
                .build();

        org = organizationRepository.save(org);
        translationService.translateChangedFields(org, true, request.getDescription() != null);
        return org;
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

        org = organizationRepository.save(org);
        translationService.translateChangedFields(org, nameChanged, descriptionChanged);
        return org;
    }

    @Transactional
    public void deactivate(Long id) {
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

        List<Long> affectedUserIds = org.getMembers().stream()
                .map(user -> user.getId())
                .filter(Objects::nonNull)
                .toList();
        org.setEnabled(false);
        organizationRepository.save(org);
        affectedUserIds.forEach(sessionRevocationService::invalidateAllSessions);
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
}
