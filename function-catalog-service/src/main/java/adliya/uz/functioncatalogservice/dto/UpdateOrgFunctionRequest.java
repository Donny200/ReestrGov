package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.*;

public record UpdateOrgFunctionRequest(
        @Size(min = 1, max = 150) @Pattern(regexp = ".*\\S.*", flags = Pattern.Flag.DOTALL) String name,
        @Size(max = 500) String description,
        @Positive Long organizationId,
        @Size(max = 500) String requirements,
        @Size(max = 100) String category,
        @Positive Long categoryId
) {
    public UpdateOrgFunctionRequest(String name, String description, Long organizationId, String requirements, String category) {
        this(name, description, organizationId, requirements, category, null);
    }
}
