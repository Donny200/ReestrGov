package adliya.uz.functioncatalogservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "azure.translator")
@Getter
@Setter
public class AzureTranslatorProperties {
    @org.springframework.beans.factory.annotation.Value("${AZURE_TRANSLATOR_ENDPOINT:}")
    private String endpoint;
    @org.springframework.beans.factory.annotation.Value("${AZURE_TRANSLATOR_KEY:}")
    private String key;
    @org.springframework.beans.factory.annotation.Value("${AZURE_TRANSLATOR_REGION:}")
    private String region;
}
