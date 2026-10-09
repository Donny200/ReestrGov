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

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    @Transactional
    public String createRefreshToken(User user) {
        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new InvalidRefreshTokenException("Disabled users cannot receive refresh tokens");
        }
        if (Boolean.TRUE.equals(user.getMustChangePassword())) {
            throw new InvalidRefreshTokenException("Password change is required before issuing a refresh token");
        }

        String rawToken = generateRawToken();

        RefreshToken entity = RefreshToken.builder()
                .tokenHash(hash(rawToken))
                .user(user)
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpiration()))
                .build();

        refreshTokenRepository.save(entity);
        return rawToken;
    }

    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public RotationResult rotate(String rawToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHashForUpdate(hash(rawToken))
                .orElseThrow(() -> new InvalidRefreshTokenException("Unknown refresh token"));

        if (!Boolean.TRUE.equals(stored.getUser().getEnabled())) {
            refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
            throw new InvalidRefreshTokenException("Disabled users cannot refresh a session");
        }

        if (Boolean.TRUE.equals(stored.getUser().getMustChangePassword())) {
            refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
            throw new InvalidRefreshTokenException("Password change is required before refreshing the session");
        }

        if (stored.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
            throw new InvalidRefreshTokenException("Refresh token reuse detected");
        }

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new InvalidRefreshTokenException("Refresh token expired");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        String newRawToken = createRefreshToken(stored.getUser());
        return new RotationResult(stored.getUser(), newRawToken);
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHashForUpdate(hash(rawToken))
                .ifPresent(token -> {
                    token.setRevoked(true);
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

    public record RotationResult(User user, String rawToken) {}
}
