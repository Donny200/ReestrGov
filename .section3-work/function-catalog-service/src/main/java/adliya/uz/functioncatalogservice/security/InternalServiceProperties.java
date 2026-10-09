package adliya.uz.functioncatalogservice.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.internal-auth")
public class InternalServiceProperties {
    private String identityServiceKey;
}
