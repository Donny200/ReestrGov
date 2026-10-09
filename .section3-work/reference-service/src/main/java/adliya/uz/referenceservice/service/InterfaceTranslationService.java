package adliya.uz.referenceservice.service;

import adliya.uz.referenceservice.entity.InterfaceTranslation;
import adliya.uz.referenceservice.repository.InterfaceTranslationRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterfaceTranslationService {

    /** English is the single source copy; each enabled locale is stored in the database. */
    private static final String SOURCE_LANGUAGE_CODE = "en";

    private final InterfaceTranslationRepository translationRepository;
    private final ObjectMapper objectMapper;
    private final AzureInterfaceTranslationClient azureTranslationClient;

    @Transactional
    public Map<String, String> getTranslations(String languageCode) {
        String code = normalizedCode(languageCode);
        Map<String, String> english = dictionaryForCode(SOURCE_LANGUAGE_CODE);
        if (english.isEmpty()) {
            english = readSourceDictionary();
            mergeMissing(SOURCE_LANGUAGE_CODE, english);
        }
        if ("en".equals(code)) {
            return english;
        }

        Map<String, String> translations = dictionaryForCode(code);
        Map<String, String> missing = new LinkedHashMap<>();
        english.forEach((key, value) -> {
            String existing = translations.get(key);
            if (!org.springframework.util.StringUtils.hasText(existing) || existing.equals(value)) {
                missing.put(key, value);
            }
        });
        translateMissing(code, translations, english, missing);

        // If Azure is unavailable, keep the application readable and never
        // expose raw keys such as "nav.admin" to the user.
        Map<String, String> result = new LinkedHashMap<>(english);
        result.putAll(translations);
        return result;
    }

    /**
     * Adds or updates only the provided keys. The complete resulting
     * dictionary is returned so an admin UI can save it in batches.
     */
    @Transactional
    public Map<String, String> updateTranslations(String languageCode, Map<String, String> translations) {
        String code = normalizedCode(languageCode);
        if (translations == null || translations.isEmpty()) {
            throw new IllegalArgumentException("Translations must not be empty");
        }

        Map<String, InterfaceTranslation> existing = translationRepository
                .findAllByLanguageCodeOrderByTranslationKeyAsc(code)
                .stream()
                .collect(Collectors.toMap(InterfaceTranslation::getTranslationKey, item -> item));

        List<InterfaceTranslation> changed = new ArrayList<>();
        translations.forEach((key, value) -> {
            if (key == null || key.isBlank() || value == null || value.isBlank()) {
                throw new IllegalArgumentException("Translation key and value must not be blank");
            }

            InterfaceTranslation item = existing.get(key.trim());
            if (item == null) {
                item = InterfaceTranslation.builder()
                        .languageCode(code)
                        .translationKey(key.trim())
                        .translationValue(value)
                        .build();
            } else {
                item.setTranslationValue(value);
            }
            changed.add(item);
        });
        translationRepository.saveAll(changed);
        return getTranslations(code);
    }

    @Transactional
    public void deleteTranslation(String languageCode, String key) {
        String code = normalizedCode(languageCode);
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Translation key must not be blank");
        }

        translationRepository.findAllByLanguageCodeOrderByTranslationKeyAsc(code).stream()
                .filter(item -> item.getTranslationKey().equals(key))
                .findFirst()
                .ifPresent(translationRepository::delete);
    }

    /** Called after a language is enabled so its interface translation starts immediately. */
    @Transactional
    public void createTranslationsForLanguage(String languageCode) {
        String code = normalizedCode(languageCode);
        if (SOURCE_LANGUAGE_CODE.equals(code)) {
            return;
        }
        Map<String, String> english = dictionaryForCode(SOURCE_LANGUAGE_CODE);
        if (english.isEmpty()) {
            english = readSourceDictionary();
            mergeMissing(SOURCE_LANGUAGE_CODE, english);
        }
        Map<String, String> translations = dictionaryForCode(code);
        Map<String, String> missing = new LinkedHashMap<>();
        english.forEach((key, value) -> {
            String existing = translations.get(key);
            if (!org.springframework.util.StringUtils.hasText(existing) || existing.equals(value)) {
                missing.put(key, value);
            }
        });
        translateMissing(code, translations, english, missing);
    }

    @Transactional
    public void removeTranslationsForLanguage(String languageCode) {
        translationRepository.deleteByLanguageCode(normalizedCode(languageCode));
    }

    /** Seeds only the source copy. Every non-English value is generated and stored in PostgreSQL. */
    @Transactional
    public void seedSourceTranslations() {
        mergeMissing(SOURCE_LANGUAGE_CODE, readSourceDictionary());
    }

    private Map<String, String> dictionaryForCode(String code) {
        return translationRepository.findAllByLanguageCodeOrderByTranslationKeyAsc(code).stream()
                .collect(Collectors.toMap(
                        InterfaceTranslation::getTranslationKey,
                        InterfaceTranslation::getTranslationValue,
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));
    }

    private void mergeMissing(String languageCode, Map<String, String> dictionary) {
        if (dictionary.isEmpty()) {
            return;
        }
        Set<String> existingKeys = translationRepository
                .findAllByLanguageCodeOrderByTranslationKeyAsc(languageCode)
                .stream()
                .map(InterfaceTranslation::getTranslationKey)
                .collect(Collectors.toSet());

        List<InterfaceTranslation> missing = dictionary.entrySet().stream()
                .filter(entry -> !existingKeys.contains(entry.getKey()))
                .map(entry -> InterfaceTranslation.builder()
                        .languageCode(languageCode)
                        .translationKey(entry.getKey())
                        .translationValue(entry.getValue())
                        .build())
                .toList();

        if (!missing.isEmpty()) {
            translationRepository.saveAll(missing);
        }
    }

    /**
     * Persists Azure results, but never overwrites a value manually supplied
     * by an administrator. Existing English fallback values are safe to
     * replace because they are not translations.
     */
    private void saveMachineTranslations(
            String languageCode,
            Map<String, String> translated,
            Map<String, String> englishDictionary
    ) {
        Map<String, InterfaceTranslation> existing = translationRepository
                .findAllByLanguageCodeOrderByTranslationKeyAsc(languageCode)
                .stream()
                .collect(Collectors.toMap(InterfaceTranslation::getTranslationKey, item -> item));

        List<InterfaceTranslation> changed = new ArrayList<>();
        translated.forEach((key, value) -> {
            if (!org.springframework.util.StringUtils.hasText(value)) {
                return;
            }

            InterfaceTranslation item = existing.get(key);
            if (item == null) {
                changed.add(InterfaceTranslation.builder()
                        .languageCode(languageCode)
                        .translationKey(key)
                        .translationValue(value)
                        .build());
            } else if (Objects.equals(item.getTranslationValue(), englishDictionary.get(key))) {
                item.setTranslationValue(value);
                changed.add(item);
            }
        });

        if (!changed.isEmpty()) {
            translationRepository.saveAll(changed);
        }
    }

    private void translateMissing(
            String languageCode,
            Map<String, String> translations,
            Map<String, String> english,
            Map<String, String> missing
    ) {
        if (missing.isEmpty() || SOURCE_LANGUAGE_CODE.equals(languageCode)) {
            return;
        }
        Map<String, String> translated = azureTranslationClient.translate(missing, SOURCE_LANGUAGE_CODE, languageCode);
        if (!translated.isEmpty()) {
            saveMachineTranslations(languageCode, translated, english);
            translations.putAll(translated);
        }
    }

    private Map<String, String> readSourceDictionary() {
        ClassPathResource resource = new ClassPathResource("interface-source/en.json");
        try (InputStream stream = resource.getInputStream()) {
            return objectMapper.readValue(stream, new TypeReference<LinkedHashMap<String, String>>() { });
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot read the source interface text", exception);
        }
    }

    private String normalizedCode(String languageCode) {
        if (languageCode == null || languageCode.isBlank()) {
            throw new IllegalArgumentException("Language code must not be blank");
        }
        return languageCode.trim().toLowerCase(Locale.ROOT);
    }
}
