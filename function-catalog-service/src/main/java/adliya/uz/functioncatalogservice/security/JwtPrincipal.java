package adliya.uz.functioncatalogservice.security;

import java.util.List;

public record JwtPrincipal(
        String email,
        String role,
        List<Long> organizationIds,
        List<String> permissions
) {
    public JwtPrincipal {
        organizationIds = organizationIds == null ? List.of() : List.copyOf(organizationIds);
        permissions = permissions == null ? List.of() : List.copyOf(permissions);
    }

    public boolean isSuperAdmin() {
        return "ROLE_SUPER_ADMIN".equals(role);
    }
}
