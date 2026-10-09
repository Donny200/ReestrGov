package adliya.uz.task1.dto;

import adliya.uz.task1.entity.Language;

import java.util.Locale;

/** Includes legacy aliases so the existing language selector remains compatible. */
public record LanguageResponse(
        Long id,
        String code,
        String nameNative,
        boolean isDefault,
        boolean active,
        String name,
        String nativeName,
        boolean defaultLanguage
) {
    public static LanguageResponse from(Language language) {
        String name = Locale.forLanguageTag(language.getCode()).getDisplayLanguage(Locale.ENGLISH);
        return new LanguageResponse(
                language.getId(),
                language.getCode(),
                language.getNameNative(),
                language.isDefault(),
                language.isActive(),
                name,
                language.getNameNative(),
                language.isDefault()
        );
    }
}
