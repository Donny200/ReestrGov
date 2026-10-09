package adliya.uz.referenceservice.security;

import java.util.Set;

public record JwtPrincipal(
        long userId,
        String email,
        String role,
        Set<String> permissions,
        Set<Long> organizationIds,
        long tokenVersion,
        String jti
) {
    public JwtPrincipal {
        permissions = permissions == null ? Set.of() : Set.copyOf(permissions);
        organizationIds = organizationIds == null ? Set.of() : Set.copyOf(organizationIds);
    }
}
