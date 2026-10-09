package adliya.uz.task1.service;

import adliya.uz.task1.dto.CreateOrgAdminRequest;
import adliya.uz.task1.dto.PromoteToOrgAdminRequest;
import adliya.uz.task1.dto.UpdateOrgAdminRequest;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.Role;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.EmailAlreadyExistsException;
import adliya.uz.task1.exception.ResourceNotFoundException;
import adliya.uz.task1.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final String SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";
    private static final String ORG_ADMIN_ROLE = "ROLE_ORG_ADMIN";

    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final SessionRevocationService sessionRevocationService;

    @Transactional
    public User createOrgAdmin(CreateOrgAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "User with this email already exists: " + request.getEmail());
        }

        Organization org = organizationService.getById(request.getOrganizationId());
        Role orgAdminRole = roleService.getByName(ORG_ADMIN_ROLE);

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(orgAdminRole)
                .build();

        user.getOrganizations().add(org);

        return userRepository.save(user);
    }

    @Transactional
    public User promoteToOrgAdmin(PromoteToOrgAdminRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found, ID: " + request.getUserId()));

        protectLastSuperAdmin(user);

        Organization org = organizationService.getById(request.getOrganizationId());
        Role orgAdminRole = roleService.getByName(ORG_ADMIN_ROLE);

        user.setRole(orgAdminRole);
        user.getOrganizations().add(org);

        userRepository.save(user);
        sessionRevocationService.invalidateAllSessions(user.getId());
        return userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found, ID: " + user.getId()));
    }

    @Transactional(readOnly = true)
    public List<User> getPromotionCandidates() {
        return userRepository.findAll().stream()
                .filter(user -> Boolean.TRUE.equals(user.getEnabled()))
                .filter(user -> user.getRole() != null)
                .filter(user -> !SUPER_ADMIN_ROLE.equals(user.getRole().getName()))
                .filter(user -> !ORG_ADMIN_ROLE.equals(user.getRole().getName()))
                .toList();
    }

    public List<User> getAllOrgAdmins() {
        return userRepository.findAllByRole_Name(ORG_ADMIN_ROLE);
    }

    public User getOrgAdminById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found, ID: " + id));
        requireRole(user, ORG_ADMIN_ROLE);
        return user;
    }

    @Transactional
    public User updateOrgAdmin(Long id, UpdateOrgAdminRequest request) {
        User user = getOrgAdminById(id);
        boolean invalidateSessions = false;

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());

        if (request.getOrganizationId() != null) {
            Organization org = organizationService.getById(request.getOrganizationId());
            invalidateSessions = user.getOrganizations().size() != 1
                    || user.getOrganizations().stream().noneMatch(existing -> Objects.equals(existing.getId(), org.getId()));
            user.getOrganizations().clear();
            user.getOrganizations().add(org);
        }

        if (request.getEnabled() != null && !Objects.equals(request.getEnabled(), user.getEnabled())) {
            user.setEnabled(request.getEnabled());
            invalidateSessions = true;
        }

        userRepository.save(user);
        if (invalidateSessions) {
            sessionRevocationService.invalidateAllSessions(user.getId());
            return userRepository.findById(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found, ID: " + user.getId()));
        }
        return user;
    }

    @Transactional
    public void deactivateOrgAdmin(Long id) {
        User user = getOrgAdminById(id);
        if (Boolean.TRUE.equals(user.getEnabled())) {
            user.setEnabled(false);
            userRepository.save(user);
            sessionRevocationService.invalidateAllSessions(user.getId());
        }
    }

    private void requireRole(User user, String expectedRole) {
        if (!expectedRole.equals(user.getRole().getName())) {
            throw new ResourceNotFoundException(
                    "User with ID " + user.getId() + " is not a " + expectedRole);
        }
    }

    private void protectLastSuperAdmin(User user) {
        if (Boolean.TRUE.equals(user.getEnabled())
                && user.getRole() != null
                && SUPER_ADMIN_ROLE.equals(user.getRole().getName())
                && userRepository.countByRole_NameAndEnabledTrue(SUPER_ADMIN_ROLE) <= 1) {
            throw new IllegalStateException("The last enabled SUPER_ADMIN cannot be downgraded");
        }
    }
}

