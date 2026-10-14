package adliya.uz.task1.config.security;

import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.Permission;
import adliya.uz.task1.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class JwtService {

    public static final String SESSION_CLAIM = "sid";

    private final JwtProperties jwtProperties;
    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        secretKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        return generateToken(user, null);
    }

    /** With a session id the token can be rejected as soon as that session is revoked. */
    public String generateToken(User user, String sessionId) {
        List<Long> organizationIds = user.getOrganizations().stream()
                .map(Organization::getId)
                .toList();
        List<String> permissionCodes = user.getRole().getPermissions().stream()
                .map(Permission::getCode)
                .toList();

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole().getName())
                .claim("organizationIds", organizationIds)
                .claim("permissions", permissionCodes)
                .claim("mustChangePassword", Boolean.TRUE.equals(user.getMustChangePassword()))
                .claim(SESSION_CLAIM, sessionId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(secretKey)
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
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token) && !issuedBeforeCredentialsChange(token, userDetails);
    }

    /**
     * A password change or reset invalidates every access token issued before it. JWT timestamps have second
     * precision, so a token issued within the same second as the change is still accepted.
     */
    private boolean issuedBeforeCredentialsChange(String token, UserDetails userDetails) {
        if (!(userDetails instanceof CustomUserPrincipal principal) || principal.credentialsUpdatedAt() == null) {
            return false;
        }
        Date issuedAt = extractClaim(token, Claims::getIssuedAt);
        if (issuedAt == null) {
            return true;
        }
        Instant lastAccepted = issuedAt.toInstant().plusSeconds(1);
        return !lastAccepted.isAfter(principal.credentialsUpdatedAt());
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
