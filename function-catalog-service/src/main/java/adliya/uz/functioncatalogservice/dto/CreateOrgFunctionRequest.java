package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.*;

public record CreateOrgFunctionRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 500) String description,
        @Positive Long organizationId,
        @Size(max = 500) String requirements,
        @Size(max = 100) String category,
        @Positive Long categoryId
) {
    public CreateOrgFunctionRequest(String name, String description, Long organizationId, String requirements, String category) {
        this(name, description, organizationId, requirements, category, null);
    }
}
