package adliya.uz.task1.dto;

import java.time.Instant;
import java.util.List;

public record TokenIntrospectionResponse(
        boolean active,
        Long userId,
        String email,
        String role,
        List<String> permissions,
        List<Long> organizationIds,
        Long tokenVersion,
        Boolean mustChangePassword,
        String jti,
        Instant expiresAt
) {
    public static TokenIntrospectionResponse inactive() {
        return new TokenIntrospectionResponse(
                false,
                null,
                null,
                null,
                List.of(),
                List.of(),
                null,
                null,
                null,
                null
        );
    }
}
