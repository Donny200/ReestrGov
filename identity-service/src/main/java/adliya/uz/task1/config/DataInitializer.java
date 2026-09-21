package adliya.uz.task1.config;

import adliya.uz.task1.entity.Permission;
import adliya.uz.task1.entity.Role;
import adliya.uz.task1.repository.PermissionRepository;
import adliya.uz.task1.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Order(0)
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public DataInitializer(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    private record PermissionSeed(String code, String name, String category) {}

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        // Roles
        List<String> roleNames = List.of("ROLE_SUPER_ADMIN", "ROLE_ORG_ADMIN", "ROLE_MODERATOR");
        for (String roleName : roleNames) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                System.out.println(roleName + " bazaga muvaffaqiyatli qo'shildi!");
            }
        }

        // Permission catalogue
        List<PermissionSeed> permissionSeeds = List.of(
                new PermissionSeed("ORGANIZATIONS_VIEW", "View organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_CREATE", "Create organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_EDIT", "Edit organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_DEACTIVATE", "Deactivate organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_REACTIVATE", "Reactivate organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_EDIT_OWN", "Edit own organization's profile", "Organization Management"),

                new PermissionSeed("ORG_ADMINS_VIEW", "View org admins", "Org Admin Management"),
                new PermissionSeed("ORG_ADMINS_CREATE", "Create org admins", "Org Admin Management"),
                new PermissionSeed("ORG_ADMINS_EDIT", "Edit org admins", "Org Admin Management"),
                new PermissionSeed("ORG_ADMINS_DEACTIVATE", "Deactivate org admins", "Org Admin Management"),

                new PermissionSeed("MODERATORS_VIEW", "View moderators", "Moderator Management"),
                new PermissionSeed("MODERATORS_CREATE", "Create moderators", "Moderator Management"),
                new PermissionSeed("MODERATORS_EDIT", "Edit moderators", "Moderator Management"),
                new PermissionSeed("MODERATORS_DEACTIVATE", "Deactivate moderators", "Moderator Management"),

                new PermissionSeed("USERS_VIEW", "View all users", "User Management"),
                new PermissionSeed("USERS_CREATE", "Create users", "User Management"),
                new PermissionSeed("USERS_EDIT", "Edit users", "User Management"),
                new PermissionSeed("USERS_DEACTIVATE", "Deactivate users", "User Management"),

                new PermissionSeed("LANGUAGES_VIEW", "Search language catalog", "Language Management"),
                new PermissionSeed("LANGUAGES_CREATE", "Add languages", "Language Management"),
                new PermissionSeed("LANGUAGES_DELETE", "Delete languages", "Language Management"),

                new PermissionSeed("FUNCTIONS_VIEW", "View functions (admin)", "Function Management"),
                new PermissionSeed("FUNCTIONS_CREATE", "Create organization functions", "Function Management"),
                new PermissionSeed("FUNCTIONS_EDIT", "Edit organization functions", "Function Management"),
                new PermissionSeed("FUNCTIONS_MANAGE_REQUIREMENTS", "Edit function requirements", "Function Management"),
                new PermissionSeed("FUNCTIONS_DEACTIVATE", "Deactivate functions", "Function Management"),
                new PermissionSeed("FUNCTIONS_MANAGE_ANY_ORGANIZATION", "Manage functions across all organizations", "Function Management"),

                new PermissionSeed("TRANSLATION_KEYS_VIEW", "View translation keys", "Translation Management"),
                new PermissionSeed("TRANSLATION_KEYS_CREATE", "Create translation keys", "Translation Management"),
                new PermissionSeed("TRANSLATION_KEYS_EDIT", "Edit translation keys", "Translation Management"),
                new PermissionSeed("TRANSLATION_KEYS_DEACTIVATE", "Deactivate translation keys", "Translation Management"),
                new PermissionSeed("TRANSLATIONS_EDIT", "Edit interface translations", "Translation Management"),
                new PermissionSeed("TRANSLATIONS_VIEW_COVERAGE", "View translation coverage", "Translation Management"),

                new PermissionSeed("ROLES_VIEW", "View roles", "Role & Permission Management"),
                new PermissionSeed("ROLES_MANAGE_PERMISSIONS", "Assign permissions to roles", "Role & Permission Management"),
                new PermissionSeed("ROLES_CREATE", "Create custom roles", "Role & Permission Management"),
                new PermissionSeed("ROLES_DELETE", "Delete custom roles", "Role & Permission Management"),
                new PermissionSeed("ROLES_ASSIGN", "Assign roles to users", "Role & Permission Management"),

                new PermissionSeed("REPORTS_VIEW", "View reports", "Reports")
        );

        for (PermissionSeed seed : permissionSeeds) {
            if (permissionRepository.findByCode(seed.code()).isEmpty()) {
                Permission permission = Permission.builder()
                        .code(seed.code())
                        .name(seed.name())
                        .category(seed.category())
                        .build();
                permissionRepository.save(permission);
            }
        }

        // Assign permissions to roles
        Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN").orElseThrow();
        Set<Permission> all = new HashSet<>(permissionRepository.findAll());
        Set<String> allCodes = all.stream().map(Permission::getCode).collect(Collectors.toSet());
        Set<String> assignedCodes = superAdminRole.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
        if (!assignedCodes.equals(allCodes)) {
            superAdminRole.setPermissions(all);
            roleRepository.save(superAdminRole);
        }

        Role orgAdminRole = roleRepository.findByName("ROLE_ORG_ADMIN").orElseThrow();
        if (orgAdminRole.getPermissions().isEmpty()) {
            Set<Permission> orgAdminPerms = new HashSet<>();
            List.of("ORGANIZATIONS_VIEW", "MODERATORS_VIEW", "MODERATORS_CREATE",
                            "MODERATORS_EDIT", "MODERATORS_DEACTIVATE", "REPORTS_VIEW")
                    .forEach(code -> permissionRepository.findByCode(code).ifPresent(orgAdminPerms::add));
            orgAdminRole.setPermissions(orgAdminPerms);
            roleRepository.save(orgAdminRole);
        }

        Role moderatorRole = roleRepository.findByName("ROLE_MODERATOR").orElseThrow();
        if (moderatorRole.getPermissions().isEmpty()) {
            Set<Permission> moderatorPerms = new HashSet<>();
            List.of("ORGANIZATIONS_VIEW", "REPORTS_VIEW")
                    .forEach(code -> permissionRepository.findByCode(code).ifPresent(moderatorPerms::add));
            moderatorRole.setPermissions(moderatorPerms);
            roleRepository.save(moderatorRole);
        }

    }
}
