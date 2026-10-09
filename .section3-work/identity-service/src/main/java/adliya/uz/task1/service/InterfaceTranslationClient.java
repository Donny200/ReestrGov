package adliya.uz.task1.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Notifies the reference service after a SUPER_ADMIN enables a UI language. */
@Component
@Slf4j
public class InterfaceTranslationClient {

    @Value("${reference-service.base-url:http://localhost:8084}")
    private String referenceServiceBaseUrl;

    @Value("${reference-service.internal-key:}")
    private String referenceServiceInternalKey;

    public void translateInterfaceForLanguage(String languageCode) {
        try {
            RestClient.create(referenceServiceBaseUrl)
                    .post()
                    .uri("/internal/interface-translations/languages/{languageCode}", languageCode)
                    .header("X-Internal-Service-Key", referenceServiceInternalKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception exception) {
            // A language still remains enabled. Its translation is retried when the UI requests it.
            log.warn("Could not start interface translation for {}: {}", languageCode, exception.getMessage());
        }
    }
}
