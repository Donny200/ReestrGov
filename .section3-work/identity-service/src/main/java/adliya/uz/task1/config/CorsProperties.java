package adliya.uz.task1.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotEmpty;

import java.net.URI;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Component
@Validated
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {
    @NotEmpty
    private List<String> allowedOrigins = List.of();

    public List<String> requireExactOrigins() {
        Set<String> validated = new LinkedHashSet<>();
        for (String origin : allowedOrigins) {
            validateOrigin(origin);
            validated.add(origin);
        }
        if (validated.isEmpty()) {
            throw new IllegalStateException("At least one CORS origin must be configured");
        }
        return List.copyOf(validated);
    }

    private void validateOrigin(String origin) {
        if (origin == null || origin.isBlank() || !origin.equals(origin.trim()) || origin.contains("*")) {
            throw new IllegalStateException("CORS origins must be exact and cannot contain wildcards");
        }

        URI uri;
        try {
            uri = URI.create(origin);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Invalid CORS origin: " + origin, exception);
        }

        boolean supportedScheme = "http".equalsIgnoreCase(uri.getScheme())
                || "https".equalsIgnoreCase(uri.getScheme());
        boolean hasOnlyOriginComponents = uri.getHost() != null
                && uri.getUserInfo() == null
                && (uri.getRawPath() == null || uri.getRawPath().isEmpty())
                && uri.getRawQuery() == null
                && uri.getRawFragment() == null;
        if (!supportedScheme || !hasOnlyOriginComponents) {
            throw new IllegalStateException("CORS value must be an exact HTTP(S) origin: " + origin);
        }
    }
}
