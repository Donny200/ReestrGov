package adliya.uz.functioncatalogservice.dto;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.TranslatedText;

import java.util.Map;

public record OrgFunctionResponse(
        Long id,
        String name,
        String description,
        Long organizationId,
        String requirements,
        String category,
        Map<String, TranslatedText> nameTranslations,
        Map<String, TranslatedText> descriptionTranslations
) {
    public static OrgFunctionResponse from(OrgFunction function) {
        return new OrgFunctionResponse(
                function.getId(),
                function.getName(),
                function.getDescription(),
                function.getOrganizationId(),
                function.getRequirements(),
                function.getCategory(),
                function.getNameTranslations(),
                function.getDescriptionTranslations()
        );
    }
}
