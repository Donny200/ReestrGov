package adliya.uz.functioncatalogservice.security;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public record TokenIntrospectionResponse(
        boolean active,
        Long userId,
        String email,
        String role,
        Set<String> permissions,
        List<Long> organizationIds,
        Long tokenVersion,
        boolean mustChangePassword,
        String jti,
        Instant expiresAt
) {
    public boolean hasCanonicalIdentity() {
        return userId != null && userId > 0
                && email != null && !email.isBlank()
                && role != null && !role.isBlank()
                && tokenVersion != null && tokenVersion >= 0
                && jti != null && !jti.isBlank()
                && expiresAt != null;
    }

    public Set<String> safePermissions() {
        return permissions == null ? Set.of() : Set.copyOf(permissions);
    }

    public List<Long> safeOrganizationIds() {
        return organizationIds == null ? List.of() : List.copyOf(organizationIds);
    }
}
