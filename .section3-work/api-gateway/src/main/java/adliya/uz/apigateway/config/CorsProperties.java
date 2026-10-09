package adliya.uz.apigateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@ConfigurationProperties(prefix = "app.cors")
@Component
public class CorsProperties {

    private List<String> allowedOrigins = List.of();

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }

    public List<String> requireExactOrigins() {
        if (allowedOrigins.isEmpty()) {
            throw new IllegalStateException("At least one CORS origin must be configured");
        }

        Set<String> validated = new LinkedHashSet<>();
        for (String origin : allowedOrigins) {
            validateOrigin(origin);
            validated.add(origin);
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
