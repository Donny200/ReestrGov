package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOrgFunctionRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 500) String description,
        @NotNull Long organizationId,
        @Size(max = 500) String requirements,
        @Size(max = 100) String category
) {
}
