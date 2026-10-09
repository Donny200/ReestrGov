package adliya.uz.task1.service;

import adliya.uz.task1.config.AzureTranslatorProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AzureTranslationClient implements TranslationClient {

    private final AzureTranslatorProperties properties;
    private final RestClient restClient = RestClient.create();

    @Override
    public Map<String, String> translate(String text, String fromCode, List<String> toCodes) {
        if (!StringUtils.hasText(text) || !StringUtils.hasText(fromCode)) {
            return Map.of();
        }

        List<String> targets = toCodes.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(code -> code.toLowerCase(Locale.ROOT))
                .filter(code -> !code.equalsIgnoreCase(fromCode))
                .distinct()
                .toList();
        if (targets.isEmpty()) {
            return Map.of();
        }
        if (!StringUtils.hasText(properties.getEndpoint())
                || !StringUtils.hasText(properties.getKey())
                || !StringUtils.hasText(properties.getRegion())) {
            log.warn("Azure Translator is not configured; skipping {} translation(s)", targets.size());
            return Map.of();
        }

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromUriString(properties.getEndpoint())
                .path("/translate")
                .queryParam("api-version", "3.0")
                .queryParam("from", fromCode);
        targets.forEach(code -> uriBuilder.queryParam("to", code));
        URI uri = uriBuilder.build(true).toUri();

        try {
            AzureResponse[] response = restClient.post()
                    .uri(uri)
                    .header("Ocp-Apim-Subscription-Key", properties.getKey())
                    .header("Ocp-Apim-Subscription-Region", properties.getRegion())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(List.of(Map.of("Text", text)))
                    .retrieve()
                    .body(AzureResponse[].class);

            if (response == null || response.length == 0 || response[0].translations() == null) {
                log.warn("Azure Translator returned no translations");
                return Map.of();
            }

            Map<String, String> translated = new LinkedHashMap<>();
            for (AzureTranslation translation : response[0].translations()) {
                if (translation != null && StringUtils.hasText(translation.to()) && StringUtils.hasText(translation.text())) {
                    translated.put(translation.to().toLowerCase(Locale.ROOT), translation.text());
                }
            }
            return translated;
        } catch (Exception exception) {
            log.warn("Azure Translator request failed: {}", exception.getMessage());
            return Map.of();
        }
    }

    private record AzureResponse(List<AzureTranslation> translations) {
    }

    private record AzureTranslation(String text, String to) {
    }
}
