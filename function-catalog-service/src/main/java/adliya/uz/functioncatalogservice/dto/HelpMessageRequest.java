package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HelpMessageRequest(@NotBlank @Size(max = 2000) String message, @Size(max = 200) String website) {}
