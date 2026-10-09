package adliya.uz.task1.config.security;

import adliya.uz.task1.config.CorsProperties;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
@Profile("prod")
public class ProductionWebSecurityValidator implements InitializingBean {

    private final CookieProperties cookieProperties;
    private final CorsProperties corsProperties;

    public ProductionWebSecurityValidator(
            CookieProperties cookieProperties,
            CorsProperties corsProperties
    ) {
        this.cookieProperties = cookieProperties;
        this.corsProperties = corsProperties;
    }

    @Override
    public void afterPropertiesSet() {
        if (!cookieProperties.isSecure()) {
            throw new IllegalStateException("Production cookies must use Secure=true");
        }
        if (!"Strict".equalsIgnoreCase(cookieProperties.getSameSite())) {
            throw new IllegalStateException("Production cookies must use SameSite=Strict");
        }
        for (String origin : corsProperties.requireExactOrigins()) {
            URI uri;
            try {
                uri = URI.create(origin);
            } catch (IllegalArgumentException exception) {
                throw new IllegalStateException("Invalid production CORS origin: " + origin, exception);
            }
            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || uri.getHost() == null
                    || (uri.getRawPath() != null && !uri.getRawPath().isEmpty())
                    || uri.getRawQuery() != null
                    || uri.getRawFragment() != null
                    || uri.getUserInfo() != null) {
                throw new IllegalStateException("Production CORS origins must be exact HTTPS origins: " + origin);
            }
        }
    }
}
