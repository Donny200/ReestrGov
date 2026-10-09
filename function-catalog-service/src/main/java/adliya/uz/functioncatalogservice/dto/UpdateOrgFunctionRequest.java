package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateOrgFunctionRequest(
        @Size(min = 1, max = 150) @Pattern(regexp = ".*\\S.*", flags = Pattern.Flag.DOTALL) String name,
        @Size(max = 500) String description,
        @Positive Long organizationId,
        @Size(max = 500) String requirements,
        @Size(max = 100) String category,
        @Positive Long categoryId,
        @Pattern(regexp = "[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*") @Size(max = 35) String sourceLanguage,
        @Valid ServiceInstructions instructions,
        @Size(max = 500) @Pattern(regexp = OfficialSourceUrl.PATTERN, message = OfficialSourceUrl.MESSAGE) String officialSourceUrl
) {
    public UpdateOrgFunctionRequest(String name, String description, Long organizationId, String requirements,
                                    String category, Long categoryId, String sourceLanguage) {
        this(name, description, organizationId, requirements, category, categoryId, sourceLanguage, null, null);
    }
}
