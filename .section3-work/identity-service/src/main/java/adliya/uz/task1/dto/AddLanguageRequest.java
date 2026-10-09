package adliya.uz.task1.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AddLanguageRequest(
        @NotBlank(message = "Language code is required")
        @Pattern(regexp = "(?i)^[a-z]{2}$", message = "Language code must be an ISO-639-1 code")
        String code
) {
}
