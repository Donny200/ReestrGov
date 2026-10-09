package adliya.uz.functioncatalogservice.exception;

import java.time.Duration;

public class RateLimitExceededException extends RuntimeException {
    private final Duration retryAfter;
    public RateLimitExceededException(Duration retryAfter) {
        super("Too many reports; try again later");
        this.retryAfter = retryAfter;
    }
    public Duration retryAfter() { return retryAfter; }
}
