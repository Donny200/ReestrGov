package adliya.uz.referenceservice.security;

import java.time.Instant;
import java.util.Set;

public record TokenIntrospectionResponse(
        boolean active,
        Long userId,
        String email,
        String role,
        Set<String> permissions,
        Set<Long> organizationIds,
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

    public Set<Long> safeOrganizationIds() {
        return organizationIds == null ? Set.of() : Set.copyOf(organizationIds);
    }
}
