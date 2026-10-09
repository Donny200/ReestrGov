package adliya.uz.task1.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@Slf4j
public class FunctionCatalogTranslationClient {

    @Value("${function-catalog-service.base-url:http://localhost:8085}")
    private String functionCatalogBaseUrl;

    @Value("${function-catalog-service.internal-key:}")
    private String functionCatalogInternalKey;

    public void translateExistingForLanguage(String languageCode) {
        try {
            RestClient.create(functionCatalogBaseUrl)
                    .post()
                    .uri("/internal/translations/languages/{languageCode}", languageCode)
                    .header("X-Internal-Service-Key", functionCatalogInternalKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception exception) {
            log.warn("Could not request Function catalog translations for {}: {}", languageCode, exception.getMessage());
        }
    }
}
