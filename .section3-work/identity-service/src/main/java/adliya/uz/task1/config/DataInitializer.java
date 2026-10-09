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

        //  Permissions (representative set — 15 across 5 categories)
        List<PermissionSeed> permissionSeeds = List.of(
                new PermissionSeed("ORGANIZATIONS_VIEW", "View organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_CREATE", "Create organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_EDIT", "Edit organizations", "Organization Management"),
                new PermissionSeed("ORGANIZATIONS_DEACTIVATE", "Deactivate organizations", "Organization Management"),

                new PermissionSeed("ORG_ADMINS_VIEW", "View org admins", "Org Admin Management"),
                new PermissionSeed("ORG_ADMINS_CREATE", "Create org admins", "Org Admin Management"),
                new PermissionSeed("ORG_ADMINS_EDIT", "Edit org admins", "Org Admin Management"),
                new PermissionSeed("ORG_ADMINS_DEACTIVATE", "Deactivate org admins", "Org Admin Management"),

                new PermissionSeed("MODERATORS_VIEW", "View moderators", "Moderator Management"),
                new PermissionSeed("MODERATORS_CREATE", "Create moderators", "Moderator Management"),
                new PermissionSeed("MODERATORS_EDIT", "Edit moderators", "Moderator Management"),
                new PermissionSeed("MODERATORS_DEACTIVATE", "Deactivate moderators", "Moderator Management"),

                new PermissionSeed("ROLES_VIEW", "View roles", "Role & Permission Management"),
                new PermissionSeed("ROLES_MANAGE_PERMISSIONS", "Assign permissions to roles", "Role & Permission Management"),

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
        if (superAdminRole.getPermissions().isEmpty()) {
            Set<Permission> all = new HashSet<>(permissionRepository.findAll());
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
