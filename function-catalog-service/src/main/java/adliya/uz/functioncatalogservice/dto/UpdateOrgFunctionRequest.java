package adliya.uz.functioncatalogservice.dto;

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
        @Pattern(regexp = "[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*") @Size(max = 35) String sourceLanguage
) {}
