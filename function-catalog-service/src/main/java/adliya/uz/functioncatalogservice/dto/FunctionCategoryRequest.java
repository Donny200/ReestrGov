package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.*;
import java.util.Map;

public record FunctionCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 100) Map<@Pattern(regexp = "[a-z]{2,3}(-[a-z0-9]{2,8})*") String,
                @NotBlank @Size(max = 100) String> nameTranslations
) {}
