package adliya.uz.task1.config.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String privateKey;
    private String publicKey;
    private String issuer;
    private String audience;
    private Long expiration;
    private Long refreshExpiration;
}
