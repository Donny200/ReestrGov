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
        @JsonInclude(JsonInclude.Include.NON_NULL) Long verifiedByUserId,
        @JsonInclude(JsonInclude.Include.NON_NULL) Long revisionOfId,
        @JsonInclude(JsonInclude.Include.NON_NULL) RevisionSummary revision
) {
    /** Pending draft revision of a published card, as seen by staff. */
    public record RevisionSummary(Long id, FunctionStatus status) {
        public static RevisionSummary of(OrgFunction revision) {
            return revision == null ? null : new RevisionSummary(revision.getId(), revision.getStatus());
        }
    }

    public static OrgFunctionResponse from(OrgFunction function) {
        return of(function, function.getVerifiedByUserId(), function.getRevisionOfId(), null);
    }

    public static OrgFunctionResponse from(OrgFunction function, OrgFunction draftRevision) {
        return of(function, function.getVerifiedByUserId(), function.getRevisionOfId(), RevisionSummary.of(draftRevision));
    }

    public static OrgFunctionResponse publicFrom(OrgFunction function) {
        return of(function, null, null, null);
    }

    private static OrgFunctionResponse of(OrgFunction function, Long verifiedByUserId, Long revisionOfId, RevisionSummary revision) {
        return new OrgFunctionResponse(function.getId(), function.getName(), function.getDescription(),
                function.getOrganizationId(), function.getRequirements(), function.getCategory(), function.getActive(),
                function.getNameTranslations(), function.getDescriptionTranslations(), function.getStatus(),
                function.getFunctionCategory() == null ? null : function.getFunctionCategory().getId(), function.getSourceLanguage(),
                ServiceInstructions.of(function),
                function.getInstructionTranslations() == null ? Map.of() : function.getInstructionTranslations(),
                function.getOfficialSourceUrl(), function.getLastVerifiedAt(),
                function.verificationStatus(Instant.now()), verifiedByUserId, revisionOfId, revision);
    }
}
