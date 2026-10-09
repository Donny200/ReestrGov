package adliya.uz.task1.service;

import adliya.uz.task1.dto.LanguageCatalogItem;
import adliya.uz.task1.dto.LanguageSearchResult;
import adliya.uz.task1.entity.Language;
import adliya.uz.task1.exception.ResourceNotFoundException;
import adliya.uz.task1.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LanguageService {

    private static final Set<String> ISO_CODES = Set.copyOf(Arrays.asList(Locale.getISOLanguages()));

    private final LanguageRepository languageRepository;
    private final OrganizationTranslationService organizationTranslationService;
    private final FunctionCatalogTranslationClient functionCatalogTranslationClient;
    private final InterfaceTranslationClient interfaceTranslationClient;

    public List<LanguageCatalogItem> getCatalog() {
        return ISO_CODES.stream()
                .map(LanguageCatalogItem::fromCode)
                .sorted(Comparator.comparing(LanguageCatalogItem::nameNative))
                .toList();
    }

    public List<Language> getActive() {
        return languageRepository.findAllByActiveTrue();
    }

    public List<LanguageSearchResult> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }

        String needle = query.trim().toLowerCase(Locale.ROOT);
        Set<String> activeCodes = languageRepository.findAllByActiveTrue().stream()
                .map(Language::getCode)
                .collect(Collectors.toSet());

        return ISO_CODES.stream()
                .map(code -> {
                    Locale locale = Locale.forLanguageTag(code);
                    return new LanguageSearchResult(
                            code,
                            locale.getDisplayLanguage(Locale.ENGLISH),
                            locale.getDisplayLanguage(locale),
                            activeCodes.contains(code)
                    );
                })
                .filter(language -> language.code().contains(needle)
                        || language.name().toLowerCase(Locale.ROOT).contains(needle)
                        || language.nativeName().toLowerCase(Locale.ROOT).contains(needle))
                .sorted(Comparator.comparing(LanguageSearchResult::name))
                .toList();
    }

    @Transactional
    public Language add(String rawCode) {
        String code = rawCode.trim().toLowerCase(Locale.ROOT);
        if (!ISO_CODES.contains(code)) {
            throw new IllegalArgumentException("Unsupported ISO-639-1 language code: " + rawCode);
        }
        if (languageRepository.existsByCode(code)) {
            throw new IllegalStateException("Language already enabled: " + code);
        }

        Locale locale = Locale.forLanguageTag(code);
        Language language = languageRepository.save(Language.builder()
                .code(code)
                .nameNative(locale.getDisplayLanguage(locale))
                .isDefault(false)
                .active(true)
                .build());

        organizationTranslationService.translateExistingForLanguage(code);
        functionCatalogTranslationClient.translateExistingForLanguage(code);
        interfaceTranslationClient.translateInterfaceForLanguage(code);
        return language;
    }

    @Transactional
    public void remove(Long id) {
        Language language = languageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Language not found, ID: " + id));
        if (language.isDefault()) {
            throw new IllegalStateException("The default language cannot be removed: " + language.getCode());
        }
        languageRepository.delete(language);
    }
}
