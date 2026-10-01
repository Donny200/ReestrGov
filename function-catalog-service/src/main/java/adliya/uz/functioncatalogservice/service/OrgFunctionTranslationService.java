package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.TranslatedText;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class OrgFunctionTranslationService {

    public void invalidateMachineTranslations(OrgFunction function, boolean nameChanged, boolean descriptionChanged) {
        if (nameChanged) {
            function.setNameTranslations(withoutMachineTranslations(function.getNameTranslations()));
        }
        if (descriptionChanged) {
            function.setDescriptionTranslations(withoutMachineTranslations(function.getDescriptionTranslations()));
        }
    }

    private static Map<String, TranslatedText> withoutMachineTranslations(Map<String, TranslatedText> translations) {
        Map<String, TranslatedText> preserved = translations == null
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(translations);
        preserved.entrySet().removeIf(entry ->
                entry.getValue() != null && TranslatedText.MACHINE.equals(entry.getValue().source()));
        return preserved;
    }
}
