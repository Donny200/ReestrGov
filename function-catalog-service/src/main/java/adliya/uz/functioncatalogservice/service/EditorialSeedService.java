package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.FunctionCategory;
import adliya.uz.functioncatalogservice.entity.FunctionStatus;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.TranslatedText;
import adliya.uz.functioncatalogservice.repository.FunctionCategoryRepository;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class EditorialSeedService {

    private static final String SEED_LANGUAGE = "ru";
    private static final List<String> TARGET_LANGUAGES = List.of("en", "uz");

    private final OrgFunctionRepository functions;
    private final FunctionCategoryRepository categories;
    private final TranslationClient translator;
    private final AuditWriter audit;

    @Transactional
    public void seed(Seed seed) {
        OrgFunction function = functions.findBySeedKey(seed.key()).orElse(null);
        if (function == null) {
            function = createDraft(seed);
        } else if (function.getStatus() != FunctionStatus.DRAFT
                || !Objects.equals(seed.name(), function.getName())
                || !Objects.equals(seed.description(), function.getDescription())) {
            return;
        }

        boolean translated = fill(function.getName(), function.getNameTranslations());
        translated |= fill(function.getDescription(), function.getDescriptionTranslations());
        if (translated) {
            functions.saveAndFlush(function);
            audit.seedTranslations(function);
        }
        if (!function.getNameTranslations().keySet().containsAll(TARGET_LANGUAGES)
                || !function.getDescriptionTranslations().keySet().containsAll(TARGET_LANGUAGES)) {
            log.warn("Editorial draft {} awaits Azure translations (en/uz); retry on next startup", seed.key());
        }
    }

    private OrgFunction createDraft(Seed seed) {
        FunctionCategory category = categories.findByName(seed.category()).orElseGet(() ->
                categories.save(FunctionCategory.builder()
                        .name(seed.category())
                        .nameTranslations(human(seed.category()))
                        .build()));
        OrgFunction function = OrgFunction.builder()
                .seedKey(seed.key())
                .name(seed.name())
                .description(seed.description())
                .sourceLanguage(SEED_LANGUAGE)
                .requirements(seed.requirements())
                .functionCategory(category)
                .status(FunctionStatus.DRAFT)
                .nameTranslations(human(seed.name()))
                .descriptionTranslations(human(seed.description()))
                .build();
        functions.saveAndFlush(function);
        audit.seeded(function);
        return function;
    }

    private boolean fill(String text, Map<String, TranslatedText> values) {
        List<String> missing = TARGET_LANGUAGES.stream().filter(code -> !values.containsKey(code)).toList();
        if (missing.isEmpty()) {
            return false;
        }
        Map<String, String> generated = translator.translate(text, SEED_LANGUAGE, missing);
        boolean changed = false;
        for (String code : missing) {
            String translated = generated.get(code);
            if (translated != null && !translated.isBlank()) {
                values.put(code, new TranslatedText(translated, TranslatedText.MACHINE));
                changed = true;
            }
        }
        return changed;
    }

    private static Map<String, TranslatedText> human(String text) {
        Map<String, TranslatedText> values = new LinkedHashMap<>();
        values.put(SEED_LANGUAGE, new TranslatedText(text, TranslatedText.HUMAN));
        return values;
    }

    public record Seed(String key, String name, String description, String requirements, String category) {}
}
