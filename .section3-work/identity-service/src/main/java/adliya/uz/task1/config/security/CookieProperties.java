package adliya.uz.task1.config.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.cookie")
public class CookieProperties {
    private boolean secure = true;
    private String sameSite = "Strict";
    private String accessTokenName = "accessToken";
    private String refreshTokenName = "refreshToken";
    private String refreshTokenPath = "/api/auth";
}
