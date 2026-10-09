package adliya.uz.task1.service;

import adliya.uz.task1.entity.Language;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.TranslatedText;
import adliya.uz.task1.repository.LanguageRepository;
import adliya.uz.task1.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrganizationTranslationService {

    private final OrganizationRepository organizationRepository;
    private final LanguageRepository languageRepository;
    private final TranslationClient translationClient;

    @Transactional
    public void translateChangedFields(Organization organization, boolean nameChanged, boolean descriptionChanged) {
        String sourceCode = sourceLanguageCode();
        List<String> targets = activeTargetCodes(sourceCode);
        if (nameChanged) {
            translateField(organization.getName(), organization.getNameTranslations(), targets, sourceCode, true,
                    organization::setNameTranslations);
        }
        if (descriptionChanged) {
            translateField(organization.getDescription(), organization.getDescriptionTranslations(), targets, sourceCode, true,
                    organization::setDescriptionTranslations);
        }
        organizationRepository.save(organization);
    }

    @Transactional
    public void translateExistingForLanguage(String languageCode) {
        String targetCode = languageCode.toLowerCase();
        String sourceCode = sourceLanguageCode();
        if (sourceCode.equals(targetCode)) {
            return;
        }

        for (Organization organization : organizationRepository.findAll()) {
            translateField(organization.getName(), organization.getNameTranslations(), List.of(targetCode), sourceCode, false,
                    organization::setNameTranslations);
            translateField(organization.getDescription(), organization.getDescriptionTranslations(), List.of(targetCode), sourceCode, false,
                    organization::setDescriptionTranslations);
            organizationRepository.save(organization);
        }
    }

    private void translateField(
            String original,
            Map<String, TranslatedText> existing,
            List<String> candidates,
            String sourceCode,
            boolean replaceMachineTranslations,
            java.util.function.Consumer<Map<String, TranslatedText>> setter
    ) {
        if (!StringUtils.hasText(original) || candidates.isEmpty()) {
            return;
        }

        Map<String, TranslatedText> translations = existing == null ? new LinkedHashMap<>() : new LinkedHashMap<>(existing);
        List<String> targets = new ArrayList<>();
        for (String code : candidates) {
            TranslatedText current = translations.get(code);
            if (current == null || (replaceMachineTranslations && TranslatedText.MACHINE.equals(current.source()))) {
                if (!TranslatedText.HUMAN.equals(current == null ? null : current.source())) {
                    targets.add(code);
                }
            }
        }

        Map<String, String> translated = translationClient.translate(original, sourceCode, targets);
        translated.forEach((code, text) -> translations.put(code, new TranslatedText(text, TranslatedText.MACHINE)));
        setter.accept(translations);
    }

    private List<String> activeTargetCodes(String sourceCode) {
        return languageRepository.findAllByActiveTrue().stream()
                .map(Language::getCode)
                .filter(code -> !sourceCode.equals(code))
                .toList();
    }

    private String sourceLanguageCode() {
        return languageRepository.findByIsDefaultTrueAndActiveTrue()
                .map(Language::getCode)
                .orElse("en");
    }
}
