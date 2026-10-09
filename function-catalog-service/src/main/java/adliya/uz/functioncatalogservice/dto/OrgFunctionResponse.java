package adliya.uz.functioncatalogservice.dto;

import adliya.uz.functioncatalogservice.entity.*;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

public record OrgFunctionResponse(
        Long id, String name, String description, Long organizationId, String requirements,
        String category, Boolean active,
        Map<String, TranslatedText> nameTranslations, Map<String, TranslatedText> descriptionTranslations,
        FunctionStatus status, Long categoryId, String sourceLanguage,
        ServiceInstructions instructions, Map<String, Map<String, TranslatedText>> instructionTranslations,
        String officialSourceUrl, Instant lastVerifiedAt, VerificationStatus verificationStatus,
        @JsonInclude(JsonInclude.Include.NON_NULL) Long verifiedByUserId
) {
    public static OrgFunctionResponse from(OrgFunction function) {
        return of(function, function.getVerifiedByUserId());
    }

    public static OrgFunctionResponse publicFrom(OrgFunction function) {
        return of(function, null);
    }

    private static OrgFunctionResponse of(OrgFunction function, Long verifiedByUserId) {
        return new OrgFunctionResponse(function.getId(), function.getName(), function.getDescription(),
                function.getOrganizationId(), function.getRequirements(), function.getCategory(), function.getActive(),
                function.getNameTranslations(), function.getDescriptionTranslations(), function.getStatus(),
                function.getFunctionCategory() == null ? null : function.getFunctionCategory().getId(), function.getSourceLanguage(),
                ServiceInstructions.of(function),
                function.getInstructionTranslations() == null ? Map.of() : function.getInstructionTranslations(),
                function.getOfficialSourceUrl(), function.getLastVerifiedAt(),
                function.verificationStatus(Instant.now()), verifiedByUserId);
    }
}
