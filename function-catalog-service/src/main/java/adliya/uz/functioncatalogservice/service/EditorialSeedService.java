package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.*;
import adliya.uz.functioncatalogservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
public class EditorialSeedService {
    private final OrgFunctionRepository functions;
    private final FunctionCategoryRepository categories;
    private final TranslationClient translator;
    private final AuditWriter audit;

    @Transactional
    public void seed(Seed seed) {
        var existing = functions.findBySeedKey(seed.key());
        OrgFunction function;
        if (existing.isPresent()) {
            function = existing.get();
            // Never replace editorial changes or republish an existing seed on startup.
            if (function.getStatus() != FunctionStatus.DRAFT
                    || !seed.name().equals(function.getName()) || !seed.description().equals(function.getDescription())) return;
        } else {
            var category = categories.findByName(seed.category()).orElseGet(() ->
                    categories.save(FunctionCategory.builder().name(seed.category())
                            .nameTranslations(new LinkedHashMap<>(Map.of("ru", new TranslatedText(seed.category(), TranslatedText.HUMAN)))).build()));
            function = OrgFunction.builder().seedKey(seed.key()).name(seed.name()).description(seed.description())
                    .sourceLanguage("ru").requirements(seed.requirements()).functionCategory(category).status(FunctionStatus.DRAFT)
                    .nameTranslations(new LinkedHashMap<>(Map.of("ru", new TranslatedText(seed.name(), TranslatedText.HUMAN))))
                    .descriptionTranslations(new LinkedHashMap<>(Map.of("ru", new TranslatedText(seed.description(), TranslatedText.HUMAN))))
                    .build();
            functions.saveAndFlush(function);
            audit.seeded(function);
        }
        boolean translated = fill(function.getName(), function.getNameTranslations());
        translated |= fill(function.getDescription(), function.getDescriptionTranslations());
        if (translated) {
            functions.saveAndFlush(function);
            audit.seedTranslations(function);
        }
        if (!function.getNameTranslations().keySet().containsAll(List.of("en", "uz"))
                || !function.getDescriptionTranslations().keySet().containsAll(List.of("en", "uz"))) {
            log.warn("Editorial draft {} awaits Azure translations (en/uz); retry on next startup", seed.key());
        }
    }

    private boolean fill(String text, Map<String, TranslatedText> values) {
        var missing = List.of("en", "uz").stream().filter(code -> !values.containsKey(code)).toList();
        if (missing.isEmpty()) return false;
        var generated = translator.translate(text, "ru", missing);
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
    public record Seed(String key, String name, String description, String requirements, String category) {}
}
