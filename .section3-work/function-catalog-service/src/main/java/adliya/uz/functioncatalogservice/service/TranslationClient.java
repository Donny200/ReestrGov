package adliya.uz.functioncatalogservice.service;

import java.util.List;
import java.util.Map;

public interface TranslationClient {
    Map<String, String> translate(String text, String fromCode, List<String> toCodes);
}
