package adliya.uz.functioncatalogservice.service;

import java.util.List;
import java.util.Map;

public interface TranslationClient {
    Map<String, String> translate(String text, String fromCode, List<String> toCodes);
    default boolean isAvailable() { return false; }
    default Map<String, String> translateRequired(String text, String fromCode, List<String> toCodes) {
        return translate(text, fromCode, toCodes);
    }
}
