package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.TranslatedText;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
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
public class OrgFunctionTranslationService {

    private final OrgFunctionRepository orgFunctionRepository;
    private final IdentityLanguageClient identityLanguageClient;
    private final TranslationClient translationClient;

    @Transactional
    public void translateChangedFields(OrgFunction function, boolean nameChanged, boolean descriptionChanged) {
        String sourceCode = sourceLanguageCode();
        List<String> targets = activeTargetCodes(sourceCode);
        if (nameChanged) {
            translateField(function.getName(), function.getNameTranslations(), targets, sourceCode, true,
                    function::setNameTranslations);
        }
        if (descriptionChanged) {
            translateField(function.getDescription(), function.getDescriptionTranslations(), targets, sourceCode, true,
                    function::setDescriptionTranslations);
        }
        orgFunctionRepository.save(function);
    }

    @Transactional
    public void translateExistingForLanguage(String languageCode) {
        String targetCode = languageCode.toLowerCase();
        String sourceCode = sourceLanguageCode();
        if (sourceCode.equals(targetCode)) {
            return;
        }

        for (OrgFunction function : orgFunctionRepository.findAll()) {
            translateField(function.getName(), function.getNameTranslations(), List.of(targetCode), sourceCode, false,
                    function::setNameTranslations);
            translateField(function.getDescription(), function.getDescriptionTranslations(), List.of(targetCode), sourceCode, false,
                    function::setDescriptionTranslations);
            orgFunctionRepository.save(function);
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
        return identityLanguageClient.getActiveLanguages().stream()
                .map(IdentityLanguageClient.ActiveLanguage::code)
                .filter(code -> !sourceCode.equals(code))
                .toList();
    }

    private String sourceLanguageCode() {
        return identityLanguageClient.getActiveLanguages().stream()
                .filter(IdentityLanguageClient.ActiveLanguage::isDefault)
                .map(IdentityLanguageClient.ActiveLanguage::code)
                .findFirst()
                .orElse("en");
    }
}
