package adliya.uz.task1.service;

import adliya.uz.task1.config.security.SystemRole;
import adliya.uz.task1.dto.CreateUserRequest;
import adliya.uz.task1.dto.UpdateUserRequest;
import adliya.uz.task1.dto.UserResponse;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.Role;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.EmailAlreadyExistsException;
import adliya.uz.task1.exception.ResourceNotFoundException;
import adliya.uz.task1.repository.OrganizationRepository;
import adliya.uz.task1.repository.RoleRepository;
import adliya.uz.task1.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String USERS_VIEW = "USERS_VIEW";
    private static final String USERS_CREATE = "USERS_CREATE";
    private static final String USERS_EDIT = "USERS_EDIT";
    private static final String USERS_DEACTIVATE = "USERS_DEACTIVATE";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        User current = requirePermission(USERS_CREATE);

        String email = request.getEmail().trim();
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("User with this email already exists: " + email);
        }

        Role role = resolveRole(request.getRoleId());
        requireSuperAdminForSuperAdminRole(current, role);
        Set<Organization> organizations = resolveActiveOrganizations(request.getOrganizationIds());

        User user = User.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(normalizeNullableText(request.getPhone()))
                .role(role)
                .enabled(true)
                .build();
        user.getOrganizations().addAll(organizations);

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllForLegacyApi() {
        requirePermission(USERS_VIEW);
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getForLegacyApi(Long id) {
        requirePermission(USERS_VIEW);
        return UserResponse.from(getById(id));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User current = requirePermission(USERS_EDIT);
        User user = getById(id);
        requireSuperAdminForSuperAdminTarget(current, user);

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null) {
            String email = request.getEmail().trim();
            if (!Objects.equals(email, user.getEmail()) && userRepository.existsByEmail(email)) {
                throw new EmailAlreadyExistsException("User with this email already exists: " + email);
            }
            user.setEmail(email);
        }
        if (request.getPhone() != null) {
            user.setPhone(normalizeNullableText(request.getPhone()));
        }
        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deactivate(Long id) {
        User current = requirePermission(USERS_DEACTIVATE);
        User target = getById(id);

        requireSuperAdminForSuperAdminTarget(current, target);

        if (Objects.equals(current.getId(), target.getId())) {
            throw new IllegalStateException("You cannot deactivate your own account");
        }

        if (isEnabledSuperAdmin(target)
                && userRepository.countByRole_NameAndEnabledTrue(SystemRole.SUPER_ADMIN.authority()) <= 1) {
            throw new IllegalStateException("The last enabled SUPER_ADMIN cannot be deactivated");
        }

        if (Boolean.TRUE.equals(target.getEnabled())) {
            target.setEnabled(false);
            userRepository.save(target);
        }
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new InsufficientAuthenticationException("Authentication is required");
        }
        return getByEmail(authentication.getName());
    }

    private User requirePermission(String permissionCode) {
        User current = getCurrentUser();
        if (!Boolean.TRUE.equals(current.getEnabled())
                || current.getRole() == null
                || current.getRole().getPermissions().stream()
                .noneMatch(permission -> permissionCode.equals(permission.getCode()))) {
            throw new AccessDeniedException("Missing required permission: " + permissionCode);
        }
        return current;
    }

    private void requireSuperAdminForSuperAdminRole(User current, Role requestedRole) {
        if (SystemRole.SUPER_ADMIN.authority().equals(requestedRole.getName()) && !isSuperAdmin(current)) {
            throw new AccessDeniedException("Only SUPER_ADMIN can create another SUPER_ADMIN");
        }
    }

    private void requireSuperAdminForSuperAdminTarget(User current, User target) {
        if (isSuperAdmin(target) && !isSuperAdmin(current)) {
            throw new AccessDeniedException("Only SUPER_ADMIN can manage another SUPER_ADMIN");
        }
    }

    private boolean isSuperAdmin(User user) {
        return user.getRole() != null
                && SystemRole.SUPER_ADMIN.authority().equals(user.getRole().getName());
    }

    private Role resolveRole(Long roleId) {
        if (roleId == null) {
            throw new IllegalArgumentException("roleId is required");
        }
        return roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found, ID: " + roleId));
    }

    private Set<Organization> resolveActiveOrganizations(Set<Long> organizationIds) {
        if (organizationIds == null) {
            throw new IllegalArgumentException("organizationIds is required");
        }

        Set<Organization> organizations = new LinkedHashSet<>();
        for (Long organizationId : organizationIds) {
            if (organizationId == null) {
                throw new IllegalArgumentException("organizationId must not be null");
            }
            Organization organization = organizationRepository.findById(organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Organization not found, ID: " + organizationId));
            if (!Boolean.TRUE.equals(organization.getEnabled())) {
                throw new IllegalStateException("Organization is not active, ID: " + organizationId);
            }
            organizations.add(organization);
        }
        return organizations;
    }

    private boolean isEnabledSuperAdmin(User user) {
        return Boolean.TRUE.equals(user.getEnabled())
                && user.getRole() != null
                && SystemRole.SUPER_ADMIN.authority().equals(user.getRole().getName());
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
