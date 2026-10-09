package adliya.uz.functioncatalogservice.security;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProductionCookieSecurityValidator implements InitializingBean {

    private final CookieProperties cookieProperties;

    public ProductionCookieSecurityValidator(CookieProperties cookieProperties) {
        this.cookieProperties = cookieProperties;
    }

    @Override
    public void afterPropertiesSet() {
        if (!cookieProperties.isSecure()) {
            throw new IllegalStateException("Production CSRF cookies must use Secure=true");
        }
        if (!"Strict".equalsIgnoreCase(cookieProperties.getSameSite())) {
            throw new IllegalStateException("Production CSRF cookies must use SameSite=Strict");
        }
    }
}
