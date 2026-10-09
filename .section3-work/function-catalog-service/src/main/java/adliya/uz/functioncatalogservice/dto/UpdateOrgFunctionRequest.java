package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.Size;

public record UpdateOrgFunctionRequest(
        @Size(max = 150) String name,
        @Size(max = 500) String description,
        Long organizationId,
        @Size(max = 500) String requirements,
        @Size(max = 100) String category
) {
}
