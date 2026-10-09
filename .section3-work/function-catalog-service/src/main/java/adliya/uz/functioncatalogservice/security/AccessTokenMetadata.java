package adliya.uz.functioncatalogservice.security;

public record AccessTokenMetadata(
        long userId,
        String email,
        long tokenVersion,
        String jti
) {
}
