package adliya.uz.task1.config.security;

import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final String JWT_ALGORITHM = "RS256";
    public static final String TOKEN_TYPE_CLAIM = "tokenType";
    public static final String TOKEN_VERSION_CLAIM = "tokenVersion";
    public static final String USER_ID_CLAIM = "userId";
    public static final String ACCESS_TOKEN_TYPE = "access";

    private final JwtProperties jwtProperties;
    private RSAPrivateKey privateKey;
    private RSAPublicKey publicKey;
    private JwtParser parser;

    @PostConstruct
    public void init() {
        privateKey = RsaKeyLoader.loadPrivateKey(jwtProperties.getPrivateKey());
        publicKey = RsaKeyLoader.loadPublicKey(jwtProperties.getPublicKey());
        RsaKeyLoader.requireMatchingPair(privateKey, publicKey);
        requireText(jwtProperties.getIssuer(), "JWT issuer is required");
        requireText(jwtProperties.getAudience(), "JWT audience is required");
        if (jwtProperties.getExpiration() == null || jwtProperties.getExpiration() <= 0) {
            throw new IllegalStateException("JWT expiration must be positive");
        }
        parser = Jwts.parser()
                .verifyWith(publicKey)
                .build();
    }

    public String generateToken(User user) {
        List<Long> organizationIds = user.getOrganizations().stream()
                .map(Organization::getId)
                .toList();

        return Jwts.builder()
                .subject(user.getEmail())
                .issuer(jwtProperties.getIssuer())
                .audience().add(jwtProperties.getAudience()).and()
                .id(UUID.randomUUID().toString())
                .claim(USER_ID_CLAIM, user.getId())
                .claim("role", user.getRole().getName())
                .claim("organizationIds", organizationIds)
                .claim("mustChangePassword", Boolean.TRUE.equals(user.getMustChangePassword()))
                .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
                .claim(TOKEN_VERSION_CLAIM, user.getTokenVersion())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    public Claims extractAllClaims(String token) {
        Jws<Claims> parsedToken = parser.parseSignedClaims(token);

        if (!JWT_ALGORITHM.equals(parsedToken.getHeader().getAlgorithm())) {
            throw new UnsupportedJwtException("Only RS256 JWT signatures are accepted");
        }

        Claims claims = parsedToken.getPayload();
        if (!jwtProperties.getIssuer().equals(claims.getIssuer())) {
            throw new UnsupportedJwtException("JWT issuer is invalid");
        }
        if (claims.getAudience() == null || !claims.getAudience().contains(jwtProperties.getAudience())) {
            throw new UnsupportedJwtException("JWT audience is invalid");
        }
        if (!ACCESS_TOKEN_TYPE.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))) {
            throw new UnsupportedJwtException("Only access tokens are accepted");
        }
        requireClaimText(claims.getSubject(), "JWT subject is required");
        requireClaimText(claims.getId(), "JWT jti is required");
        requireNonNegativeLongClaim(claims, USER_ID_CLAIM, true);
        requireNonNegativeLongClaim(claims, TOKEN_VERSION_CLAIM, false);
        return claims;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        if (!(userDetails instanceof CustomUserPrincipal principal) || !principal.isEnabled()) {
            return false;
        }
        Claims claims = extractAllClaims(token);
        return principal.getUsername().equals(claims.getSubject())
                && Objects.equals(principal.userId(), longClaim(claims, USER_ID_CLAIM))
                && principal.tokenVersion() == longClaim(claims, TOKEN_VERSION_CLAIM)
                && !claims.getExpiration().before(new Date());
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public long extractUserId(Claims claims) {
        return longClaim(claims, USER_ID_CLAIM);
    }

    public long extractTokenVersion(Claims claims) {
        return longClaim(claims, TOKEN_VERSION_CLAIM);
    }

    private long requireNonNegativeLongClaim(Claims claims, String name, boolean positive) {
        long value = longClaim(claims, name);
        if ((positive && value <= 0) || (!positive && value < 0)) {
            throw new UnsupportedJwtException("JWT " + name + " claim is invalid");
        }
        return value;
    }

    private long longClaim(Claims claims, String name) {
        Object rawValue = claims.get(name);
        if (!(rawValue instanceof Number number)) {
            throw new UnsupportedJwtException("JWT " + name + " claim is required");
        }
        return number.longValue();
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(message);
        }
        return value;
    }

    private String requireClaimText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new UnsupportedJwtException(message);
        }
        return value;
    }
}
