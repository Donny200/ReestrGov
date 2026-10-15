package adliya.uz.task1.service;

import adliya.uz.task1.config.LoginProperties;
import adliya.uz.task1.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;

/**
 * Per-account brute-force protection: after {@code perAccountLimit} failed passwords for the same submitted e-mail
 * within {@code perAccountWindow}, further attempts are refused until the window ends. The counter is keyed by a
 * salted hash of the submitted address whether or not an account exists, so the response does not reveal accounts.
 */
@Component
@Slf4j
public class LoginAttemptGuard {

    private final LoginProperties properties;
    private final Clock clock;
    private final byte[] salt = new byte[16];
    private final Map<String, Failures> accounts = new HashMap<>();

    @Autowired
    public LoginAttemptGuard(LoginProperties properties) {
        this(properties, Clock.systemUTC());
    }

    LoginAttemptGuard(LoginProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        new SecureRandom().nextBytes(salt);
    }

    /** Refuses the attempt while the account is locked. */
    public synchronized void check(String email) {
        Instant now = clock.instant();
        Failures failures = accounts.get(key(email));
        if (failures != null && failures.windowEnd().isAfter(now) && failures.count() >= properties.getPerAccountLimit()) {
            throw new RateLimitExceededException(Duration.between(now, failures.windowEnd()));
        }
    }

    public synchronized void recordFailure(String email) {
        Instant now = clock.instant();
        String key = key(email);
        Failures failures = accounts.get(key);
        if (failures == null || !failures.windowEnd().isAfter(now)) {
            if (accounts.size() >= properties.getMaxTrackedClients()) {
                accounts.values().removeIf(entry -> !entry.windowEnd().isAfter(now));
            }
            failures = new Failures(now.plus(properties.getPerAccountWindow()), 0);
        }
        failures = new Failures(failures.windowEnd(), failures.count() + 1);
        accounts.put(key, failures);
        if (failures.count() == properties.getPerAccountLimit()) {
            log.warn("Login attempts for an account are refused until {} after {} failed passwords (account hash {})",
                    failures.windowEnd(), failures.count(), key.substring(0, 12));
        }
    }

    public synchronized void recordSuccess(String email) {
        accounts.remove(key(email));
    }

    private String key(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt);
            digest.update(normalized.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private record Failures(Instant windowEnd, int count) {}
}
