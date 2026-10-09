package adliya.uz.referenceservice.service;

import adliya.uz.referenceservice.config.AzureTranslatorProperties;
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
import java.util.Map;

/** Translates a batch of interface strings in a single Azure request. */
@Component
@RequiredArgsConstructor
@Slf4j
public class AzureInterfaceTranslationClient {

    private static final int MAX_TEXTS_PER_REQUEST = 100;

    private final AzureTranslatorProperties properties;
    private final RestClient restClient = RestClient.create();

    public Map<String, String> translate(Map<String, String> source, String fromCode, String toCode) {
        if (source == null || source.isEmpty() || !isConfigured()) {
            return Map.of();
        }

        List<Map.Entry<String, String>> entries = source.entrySet().stream()
                .filter(entry -> StringUtils.hasText(entry.getValue()))
                .toList();
        Map<String, String> result = new LinkedHashMap<>();

        for (int start = 0; start < entries.size(); start += MAX_TEXTS_PER_REQUEST) {
            List<Map.Entry<String, String>> batch = entries.subList(start, Math.min(start + MAX_TEXTS_PER_REQUEST, entries.size()));
            result.putAll(translateBatch(batch, fromCode, toCode));
        }
        return result;
    }

    private Map<String, String> translateBatch(List<Map.Entry<String, String>> batch, String fromCode, String toCode) {
        URI uri = UriComponentsBuilder.fromUriString(properties.getEndpoint())
                .path("/translate")
                .queryParam("api-version", "3.0")
                .queryParam("from", fromCode)
                .queryParam("to", toCode)
                .build(true)
                .toUri();
        List<Map<String, String>> body = batch.stream()
                .map(entry -> Map.of("Text", entry.getValue()))
                .toList();

        try {
            AzureResponse[] response = restClient.post()
                    .uri(uri)
                    .header("Ocp-Apim-Subscription-Key", properties.getKey())
                    .header("Ocp-Apim-Subscription-Region", properties.getRegion())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(AzureResponse[].class);

            if (response == null || response.length != batch.size()) {
                log.warn("Azure Translator returned an incomplete interface translation batch");
                return Map.of();
            }

            Map<String, String> translated = new LinkedHashMap<>();
            for (int index = 0; index < response.length; index++) {
                AzureResponse item = response[index];
                if (item != null && item.translations() != null && !item.translations().isEmpty()) {
                    String text = item.translations().get(0).text();
                    if (StringUtils.hasText(text)) {
                        translated.put(batch.get(index).getKey(), text);
                    }
                }
            }
            return translated;
        } catch (Exception exception) {
            log.warn("Azure interface translation failed: {}", exception.getMessage());
            return Map.of();
        }
    }

    private boolean isConfigured() {
        return StringUtils.hasText(properties.getEndpoint())
                && StringUtils.hasText(properties.getKey())
                && StringUtils.hasText(properties.getRegion());
    }

    private record AzureResponse(List<AzureTranslation> translations) {
    }

    private record AzureTranslation(String text) {
    }
}
