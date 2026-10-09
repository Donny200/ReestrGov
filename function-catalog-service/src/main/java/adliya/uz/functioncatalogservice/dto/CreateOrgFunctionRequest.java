package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record CreateOrgFunctionRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 500) String description,
        @Positive Long organizationId,
        @Size(max = 500) String requirements,
        @Size(max = 100) String category,
        @Positive Long categoryId,
        @Pattern(regexp = "[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*") @Size(max = 35) String sourceLanguage,
        @Valid ServiceInstructions instructions,
        @Size(max = 500) @Pattern(regexp = OfficialSourceUrl.PATTERN, message = OfficialSourceUrl.MESSAGE) String officialSourceUrl
) {
    public CreateOrgFunctionRequest(String name, String description, Long organizationId, String requirements,
                                    String category, Long categoryId, String sourceLanguage) {
        this(name, description, organizationId, requirements, category, categoryId, sourceLanguage, null, null);
    }
    public CreateOrgFunctionRequest(String name, String description, Long organizationId, String requirements, String category, Long categoryId) {
        this(name, description, organizationId, requirements, category, categoryId, null);
    }
    public CreateOrgFunctionRequest(String name, String description, Long organizationId, String requirements, String category) {
        this(name, description, organizationId, requirements, category, null);
    }
}
