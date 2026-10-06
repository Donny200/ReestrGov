package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.config.AzureTranslatorProperties;
import adliya.uz.functioncatalogservice.exception.TranslationUnavailableException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@Slf4j
public class AzureTranslationClient implements TranslationClient {

    private static final int CONNECT_TIMEOUT_MILLIS = 3000;
    private static final int READ_TIMEOUT_MILLIS = 8000;

    private final AzureTranslatorProperties properties;
    private final RestClient restClient;

    @Autowired
    public AzureTranslationClient(AzureTranslatorProperties properties) {
        this(properties, createRestClient());
    }

    AzureTranslationClient(AzureTranslatorProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    @Override
    public boolean isAvailable() {
        return StringUtils.hasText(properties.getEndpoint())
                && StringUtils.hasText(properties.getKey())
                && StringUtils.hasText(properties.getRegion());
    }

    @Override
    public Map<String, String> translate(String text, String fromCode, List<String> toCodes) {
        try {
            return translateRequired(text, fromCode, toCodes);
        } catch (TranslationUnavailableException exception) {
            log.warn("Azure Translator is unavailable ({}); translations remain pending", exception.status().value());
            return Map.of();
        }
    }

    @Override
    public Map<String, String> translateRequired(String text, String fromCode, List<String> toCodes) {
        if (!StringUtils.hasText(text) || !StringUtils.hasText(fromCode)) {
            return Map.of();
        }
        List<String> targets = targetCodes(fromCode, toCodes);
        if (targets.isEmpty()) {
            return Map.of();
        }
        if (!isAvailable()) {
            throw new TranslationUnavailableException(HttpStatus.SERVICE_UNAVAILABLE, "Automatic translation is not configured");
        }
        try {
            AzureResponse[] response = restClient.post()
                    .uri(translateUri(fromCode, targets))
                    .header("Ocp-Apim-Subscription-Key", properties.getKey())
                    .header("Ocp-Apim-Subscription-Region", properties.getRegion())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(Map.of("Text", text)))
                    .retrieve()
                    .body(AzureResponse[].class);
            return toTranslations(response);
        } catch (TranslationUnavailableException exception) {
            throw exception;
        } catch (ResourceAccessException exception) {
            throw new TranslationUnavailableException(HttpStatus.GATEWAY_TIMEOUT, "Translator did not respond; retry later");
        } catch (RestClientResponseException exception) {
            log.warn("Azure Translator returned HTTP {}", exception.getStatusCode().value());
            throw new TranslationUnavailableException(HttpStatus.BAD_GATEWAY,
                    "Translator rejected the request; retry later or contact the administrator");
        } catch (Exception exception) {
            log.warn("Azure Translator request failed ({})", exception.getClass().getSimpleName());
            throw new TranslationUnavailableException(HttpStatus.BAD_GATEWAY, "Automatic translation failed; retry later");
        }
    }

    private static List<String> targetCodes(String fromCode, List<String> toCodes) {
        return toCodes.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(code -> code.toLowerCase(Locale.ROOT))
                .filter(code -> !code.equalsIgnoreCase(fromCode))
                .distinct()
                .toList();
    }

    private URI translateUri(String fromCode, List<String> targets) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(properties.getEndpoint())
                .path("/translate")
                .queryParam("api-version", "3.0")
                .queryParam("from", fromCode);
        targets.forEach(code -> builder.queryParam("to", code));
        return builder.build(true).toUri();
    }

    private static Map<String, String> toTranslations(AzureResponse[] response) {
        if (response == null || response.length == 0 || response[0].translations() == null) {
            throw new TranslationUnavailableException(HttpStatus.BAD_GATEWAY, "Translator returned no translations");
        }
        Map<String, String> translated = new LinkedHashMap<>();
        for (AzureTranslation translation : response[0].translations()) {
            if (translation != null && StringUtils.hasText(translation.to()) && StringUtils.hasText(translation.text())) {
                translated.put(translation.to().toLowerCase(Locale.ROOT), translation.text());
            }
        }
        return translated;
    }

    private static RestClient createRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MILLIS);
        factory.setReadTimeout(READ_TIMEOUT_MILLIS);
        return RestClient.builder().requestFactory(factory).build();
    }

    private record AzureResponse(List<AzureTranslation> translations) {}

    private record AzureTranslation(String text, String to) {}
}
