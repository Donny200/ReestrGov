package adliya.uz.task1.service;

import adliya.uz.task1.dto.CreateModeratorRequest;
import adliya.uz.task1.dto.PromoteToModeratorRequest;
import adliya.uz.task1.dto.UpdateModeratorRequest;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.Role;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.EmailAlreadyExistsException;
import adliya.uz.task1.exception.ResourceNotFoundException;
import adliya.uz.task1.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModeratorService {

    private static final String SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";
    private static final String MODERATOR_ROLE = "ROLE_MODERATOR";

    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final SessionRevocationService sessionRevocationService;

    @Transactional
    public User create(CreateModeratorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "User with this email already exists: " + request.getEmail());
        }

        Set<Organization> orgs = resolveOrganizations(request.getOrganizationIds());
        checkScopeOrThrow(orgs);

        Role moderatorRole = roleService.getByName(MODERATOR_ROLE);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(moderatorRole)
                .build();

        user.getOrganizations().addAll(orgs);

        return userRepository.save(user);
    }

    @Transactional
    public User promote(PromoteToModeratorRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found, ID: " + request.getUserId()));

        User current = userService.getCurrentUser();
        validatePromotionTarget(user, current);

        Set<Organization> orgs = resolveOrganizations(request.getOrganizationIds());
        checkScopeOrThrow(orgs);

        Role moderatorRole = roleService.getByName(MODERATOR_ROLE);
        user.setRole(moderatorRole);
        user.getOrganizations().clear();
        user.getOrganizations().addAll(orgs);

        userRepository.save(user);
        sessionRevocationService.invalidateAllSessions(user.getId());
        return userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found, ID: " + user.getId()));
    }

    @Transactional(readOnly = true)
    public List<User> getPromotionCandidates() {
        User current = userService.getCurrentUser();
        Set<Long> myOrgIds = orgIdsOf(current);

        return userRepository.findAll().stream()
                .filter(user -> Boolean.TRUE.equals(user.getEnabled()))
                .filter(user -> user.getRole() != null)
                .filter(user -> !MODERATOR_ROLE.equals(user.getRole().getName()))
                .filter(user -> !SUPER_ADMIN_ROLE.equals(user.getRole().getName()))
                .filter(user -> isSuperAdmin(current)
                        || (!"ROLE_ORG_ADMIN".equals(user.getRole().getName())
                        && isEntirelyWithinScope(user, myOrgIds)))
                .toList();
    }

    public List<User> getAll() {
        User current = userService.getCurrentUser();
        List<User> moderators = userRepository.findAllByRole_Name(MODERATOR_ROLE);

        if (isSuperAdmin(current)) return moderators;

        Set<Long> myOrgIds = orgIdsOf(current);
        return moderators.stream()
                .filter(m -> orgIdsOf(m).stream().anyMatch(myOrgIds::contains))
                .toList();
    }

    public User getById(Long id) {
        User moderator = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found, ID: " + id));
        requireRole(moderator, MODERATOR_ROLE);
        checkScopeOrThrow(moderator.getOrganizations());
        return moderator;
    }

    @Transactional
    public User update(Long id, UpdateModeratorRequest request) {
        User moderator = getById(id); // includes scope check on current org(s)

        Set<Organization> newOrgs = resolveOrganizations(request.getOrganizationIds());
        checkScopeOrThrow(newOrgs); // caller must also be allowed to assign the NEW org(s)
        Set<Long> currentOrganizationIds = orgIdsOf(moderator);
        Set<Long> newOrganizationIds = newOrgs.stream().map(Organization::getId).collect(Collectors.toSet());
        boolean invalidateSessions = !currentOrganizationIds.equals(newOrganizationIds);

        if (request.getFirstName() != null) moderator.setFirstName(request.getFirstName());
        if (request.getLastName() != null) moderator.setLastName(request.getLastName());
        if (request.getPhone() != null) moderator.setPhone(request.getPhone());

        moderator.getOrganizations().clear();
        moderator.getOrganizations().addAll(newOrgs);

        if (request.getEnabled() != null && !Objects.equals(request.getEnabled(), moderator.getEnabled())) {
            moderator.setEnabled(request.getEnabled());
            invalidateSessions = true;
        }

        userRepository.save(moderator);
        if (invalidateSessions) {
            sessionRevocationService.invalidateAllSessions(moderator.getId());
            return userRepository.findById(moderator.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found, ID: " + moderator.getId()));
        }
        return moderator;
    }

    @Transactional
    public void deactivate(Long id) {
        User moderator = getById(id); // includes scope check
        if (Boolean.TRUE.equals(moderator.getEnabled())) {
            moderator.setEnabled(false);
            userRepository.save(moderator);
            sessionRevocationService.invalidateAllSessions(moderator.getId());
        }
    }


    private Set<Organization> resolveOrganizations(Set<Long> ids) {
        return ids.stream()
                .map(organizationService::getById)
                .collect(Collectors.toSet());
    }


    private void checkScopeOrThrow(Set<Organization> orgs) {
        User current = userService.getCurrentUser();
        if (isSuperAdmin(current)) return;

        Set<Long> myOrgIds = orgIdsOf(current);
        boolean allowed = orgs.stream()
                .map(Organization::getId)
                .allMatch(myOrgIds::contains);

        if (!allowed) {
            throw new AccessDeniedException(
                    "You can only manage moderators within your own organization(s)");
        }
    }

    private void validatePromotionTarget(User target, User current) {
        if (target.getRole() == null) {
            throw new IllegalStateException("User does not have an assigned role");
        }
        if (MODERATOR_ROLE.equals(target.getRole().getName())) {
            throw new IllegalStateException("User is already a moderator");
        }
        if (SUPER_ADMIN_ROLE.equals(target.getRole().getName())) {
            if (!isSuperAdmin(current)) {
                throw new AccessDeniedException("Only SUPER_ADMIN can change another SUPER_ADMIN role");
            }
            if (Boolean.TRUE.equals(target.getEnabled())
                    && userRepository.countByRole_NameAndEnabledTrue(SUPER_ADMIN_ROLE) <= 1) {
                throw new IllegalStateException("The last enabled SUPER_ADMIN cannot be downgraded");
            }
        }
        if (!isSuperAdmin(current)) {
            if ("ROLE_ORG_ADMIN".equals(target.getRole().getName())) {
                throw new AccessDeniedException("ORG_ADMIN cannot downgrade another ORG_ADMIN");
            }
            Set<Long> currentOrgIds = orgIdsOf(current);
            boolean targetInScope = isEntirelyWithinScope(target, currentOrgIds);
            if (!targetInScope) {
                throw new AccessDeniedException("You can only promote users in your organization scope");
            }
        }
    }

    private boolean isEntirelyWithinScope(User user, Set<Long> allowedOrganizationIds) {
        Set<Long> targetOrganizationIds = orgIdsOf(user);
        return !targetOrganizationIds.isEmpty()
                && allowedOrganizationIds.containsAll(targetOrganizationIds);
    }

    private Set<Long> orgIdsOf(User user) {
        return user.getOrganizations().stream()
                .map(Organization::getId)
                .collect(Collectors.toSet());
    }

    private boolean isSuperAdmin(User user) {
        return SUPER_ADMIN_ROLE.equals(user.getRole().getName());
    }

    private void requireRole(User user, String expectedRole) {
        if (!expectedRole.equals(user.getRole().getName())) {
            throw new ResourceNotFoundException(
                    "User with ID " + user.getId() + " is not a " + expectedRole);
        }
    }
}
