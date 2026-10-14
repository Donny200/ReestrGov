package adliya.uz.task1.service;

import adliya.uz.task1.config.security.JwtProperties;
import adliya.uz.task1.entity.RefreshToken;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.InvalidRefreshTokenException;
import adliya.uz.task1.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    @Transactional
    public String createRefreshToken(User user) {
        return createSession(user, null).rawToken();
    }

    /** Starts a new session: a fresh session id that every rotated token of this browser session keeps. */
    @Transactional
    public IssuedSession createSession(User user, String userAgent) {
        return issue(user, UUID.randomUUID().toString(), userAgent);
    }

    private IssuedSession issue(User user, String sessionId, String userAgent) {
        if (Boolean.TRUE.equals(user.getMustChangePassword())) {
            throw new InvalidRefreshTokenException("Password change is required before issuing a refresh token");
        }

        String rawToken = generateRawToken();
        Instant now = Instant.now();

        RefreshToken entity = RefreshToken.builder()
                .tokenHash(hash(rawToken))
                .user(user)
                .sessionId(sessionId)
                .userAgent(userAgent)
                .lastUsedAt(now)
                .expiresAt(now.plusMillis(jwtProperties.getRefreshExpiration()))
                .build();

        refreshTokenRepository.save(entity);
        return new IssuedSession(rawToken, sessionId);
    }

    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public RotationResult rotate(String rawToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("Unknown refresh token"));

        if (Boolean.TRUE.equals(stored.getUser().getMustChangePassword())) {
            refreshTokenRepository.revokeAllByUser(stored.getUser());
            throw new InvalidRefreshTokenException("Password change is required before refreshing the session");
        }

        if (stored.isRevoked()) {
            refreshTokenRepository.revokeAllByUser(stored.getUser());
            throw new InvalidRefreshTokenException("Refresh token reuse detected");
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new InvalidRefreshTokenException("Refresh token expired");
        }

        stored.setRevoked(true);
        stored.setRevokedAt(Instant.now());
        stored.setRevokedReason("ROTATED");
        refreshTokenRepository.save(stored);

        String sessionId = stored.getSessionId() == null ? UUID.randomUUID().toString() : stored.getSessionId();
        IssuedSession next = issue(stored.getUser(), sessionId, stored.getUserAgent());
        return new RotationResult(stored.getUser(), next.rawToken(), sessionId);
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken))
                .ifPresent(token -> {
                    token.setRevoked(true);
                    token.setRevokedAt(Instant.now());
                    token.setRevokedReason(SessionService.REASON_LOGOUT);
                    refreshTokenRepository.save(token);
                });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[64];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public record RotationResult(User user, String rawToken, String sessionId) {
        public RotationResult(User user, String rawToken) {
            this(user, rawToken, null);
        }
    }

    public record IssuedSession(String rawToken, String sessionId) {}
}
