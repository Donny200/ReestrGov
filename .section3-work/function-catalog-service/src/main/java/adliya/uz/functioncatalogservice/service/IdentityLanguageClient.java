package adliya.uz.functioncatalogservice.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
@Slf4j
public class IdentityLanguageClient {

    @Value("${identity-service.base-url:http://localhost:8081}")
    private String identityServiceBaseUrl;

    public List<ActiveLanguage> getActiveLanguages() {
        try {
            List<ActiveLanguage> languages = RestClient.create(identityServiceBaseUrl)
                    .get()
                    .uri("/api/languages")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() { });
            return languages == null ? List.of() : languages.stream().filter(ActiveLanguage::active).toList();
        } catch (Exception exception) {
            log.warn("Could not load active languages from identity-service: {}", exception.getMessage());
            return List.of();
        }
    }

    public record ActiveLanguage(
            @JsonProperty("code") String code,
            @JsonProperty("isDefault") boolean isDefault,
            @JsonProperty("active") boolean active
    ) {
    }
}
