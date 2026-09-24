package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LanguageTranslationRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 500) String description
) {}
