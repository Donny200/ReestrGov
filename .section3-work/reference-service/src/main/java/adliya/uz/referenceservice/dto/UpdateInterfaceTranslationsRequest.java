package adliya.uz.referenceservice.dto;

import java.util.Map;

/**
 * A partial dictionary update. Existing keys that are absent from this request
 * are kept, which makes it safe to send translations in several batches.
 */
public record UpdateInterfaceTranslationsRequest(Map<String, String> translations) {
}
