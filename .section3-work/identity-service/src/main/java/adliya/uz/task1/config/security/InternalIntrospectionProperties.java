package adliya.uz.task1.config.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.internal-auth")
public class InternalIntrospectionProperties {

    private String gatewayClientId = "api-gateway";
    private String gatewayKey;
    private String referenceServiceClientId = "reference-service";
    private String referenceServiceKey;
    private String functionCatalogServiceClientId = "function-catalog-service";
    private String functionCatalogServiceKey;

    public String expectedKey(String clientId) {
        if (Objects.equals(gatewayClientId, clientId)) {
            return gatewayKey;
        }
        if (Objects.equals(referenceServiceClientId, clientId)) {
            return referenceServiceKey;
        }
        if (Objects.equals(functionCatalogServiceClientId, clientId)) {
            return functionCatalogServiceKey;
        }
        return null;
    }
}
