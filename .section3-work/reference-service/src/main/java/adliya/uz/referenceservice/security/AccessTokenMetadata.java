package adliya.uz.referenceservice.security;

public record AccessTokenMetadata(
        long userId,
        String email,
        long tokenVersion,
        String jti
) {
}
