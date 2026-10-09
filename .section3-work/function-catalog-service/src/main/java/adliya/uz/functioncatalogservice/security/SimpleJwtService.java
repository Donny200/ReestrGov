package adliya.uz.functioncatalogservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.UnsupportedJwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPublicKey;
import java.util.Date;
import java.util.Set;

@Service
public class SimpleJwtService {

    private static final String JWT_ALGORITHM = "RS256";
    private static final String ACCESS_TOKEN_TYPE = "access";

    private final RSAPublicKey publicKey;
    private final String issuer;
    private final String audience;

    public SimpleJwtService(
            @Value("${jwt.public-key}") String publicKey,
            @Value("${jwt.issuer}") String issuer,
            @Value("${jwt.audience}") String audience
    ) {
        this.publicKey = RsaPublicKeyLoader.load(publicKey);
        this.issuer = requireText(issuer, "JWT issuer is required");
        this.audience = requireText(audience, "JWT audience is required");
    }

    public Claims parseClaims(String token) {
        Jws<Claims> parsedToken = Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token);

        if (!JWT_ALGORITHM.equals(parsedToken.getHeader().getAlgorithm())) {
            throw new UnsupportedJwtException("Only RS256 JWT signatures are accepted");
        }

        Claims claims = parsedToken.getPayload();
        validateMetadata(claims);
        if (!Boolean.FALSE.equals(claims.get("mustChangePassword", Boolean.class))) {
            throw new UnsupportedJwtException(
                    "JWT cannot authorize service access until the password has been changed"
            );
        }

        return claims;
    }

    public AccessTokenMetadata parseAccessToken(String token) {
        Claims claims = parseClaims(token);
        return new AccessTokenMetadata(
                positiveLongClaim(claims, "userId"),
                requireText(claims.getSubject(), "JWT subject is required"),
                nonNegativeLongClaim(claims, "tokenVersion"),
                claims.getId()
        );
    }

    private void validateMetadata(Claims claims) {
        if (!issuer.equals(claims.getIssuer())) {
            throw new UnsupportedJwtException("JWT issuer is invalid");
        }

        Set<String> audiences = claims.getAudience();
        if (audiences == null || !audiences.contains(audience)) {
            throw new UnsupportedJwtException("JWT audience is invalid");
        }

        requireText(claims.getId(), "JWT ID is required");
        if (!ACCESS_TOKEN_TYPE.equals(claims.get("tokenType", String.class))) {
            throw new UnsupportedJwtException("Only access tokens are accepted");
        }

        positiveLongClaim(claims, "userId");
        nonNegativeLongClaim(claims, "tokenVersion");
        requireText(claims.getSubject(), "JWT subject is required");

        Date expiration = claims.getExpiration();
        if (expiration == null) {
            throw new UnsupportedJwtException("JWT expiration is required");
        }
    }

    private long positiveLongClaim(Claims claims, String name) {
        long value = longClaim(claims, name);
        if (value <= 0) {
            throw new UnsupportedJwtException("JWT " + name + " must be positive");
        }
        return value;
    }

    private long nonNegativeLongClaim(Claims claims, String name) {
        long value = longClaim(claims, name);
        if (value < 0) {
            throw new UnsupportedJwtException("JWT " + name + " must not be negative");
        }
        return value;
    }

    private long longClaim(Claims claims, String name) {
        Object raw = claims.get(name);
        if (!(raw instanceof Number number)) {
            throw new UnsupportedJwtException("JWT " + name + " is required");
        }
        return number.longValue();
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new UnsupportedJwtException(message);
        }
        return value.trim();
    }
}

