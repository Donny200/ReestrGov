package adliya.uz.functioncatalogservice.security;

import java.util.List;
import java.util.Set;

public record JwtPrincipal(
        long userId,
        String email,
        String role,
        List<Long> organizationIds,
        Set<String> permissions,
        long tokenVersion,
        String jti
) {
    public JwtPrincipal {
        organizationIds = organizationIds == null ? List.of() : List.copyOf(organizationIds);
        permissions = permissions == null ? Set.of() : Set.copyOf(permissions);
    }

    public boolean isSuperAdmin() {
        return "ROLE_SUPER_ADMIN".equals(role);
    }
}
