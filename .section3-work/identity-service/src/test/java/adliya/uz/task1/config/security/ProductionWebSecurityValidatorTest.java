package adliya.uz.task1.config.security;

import adliya.uz.task1.config.CorsProperties;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionWebSecurityValidatorTest {

    @Test
    void acceptsSecureStrictCookiesAndExactHttpsOrigin() {
        CookieProperties cookies = cookieProperties(true, "Strict");
        CorsProperties cors = corsProperties("https://app.example.test");

        assertThatCode(() -> new ProductionWebSecurityValidator(cookies, cors).afterPropertiesSet())
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsInsecureProductionCookie() {
        CookieProperties cookies = cookieProperties(false, "Strict");

        assertThatThrownBy(() -> new ProductionWebSecurityValidator(
                cookies,
                corsProperties("https://app.example.test")
        ).afterPropertiesSet()).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void rejectsNonStrictOrHttpProductionConfiguration() {
        assertThatThrownBy(() -> new ProductionWebSecurityValidator(
                cookieProperties(true, "Lax"),
                corsProperties("https://app.example.test")
        ).afterPropertiesSet()).isInstanceOf(IllegalStateException.class);

        assertThatThrownBy(() -> new ProductionWebSecurityValidator(
                cookieProperties(true, "Strict"),
                corsProperties("http://localhost:5173")
        ).afterPropertiesSet()).isInstanceOf(IllegalStateException.class);
    }

    private CookieProperties cookieProperties(boolean secure, String sameSite) {
        CookieProperties properties = new CookieProperties();
        properties.setSecure(secure);
        properties.setSameSite(sameSite);
        return properties;
    }

    private CorsProperties corsProperties(String origin) {
        CorsProperties properties = new CorsProperties();
        properties.setAllowedOrigins(List.of(origin));
        return properties;
    }
}
