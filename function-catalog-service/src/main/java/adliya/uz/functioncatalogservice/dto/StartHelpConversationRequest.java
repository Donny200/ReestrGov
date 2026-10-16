package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** A visitor's question. {@code serviceId} is optional: without it the question goes to global support (SUPER_ADMIN). */
public record StartHelpConversationRequest(
        @Positive Long serviceId,
        @NotBlank @Size(min = 10, max = 2000) String message,
        @Size(max = 254) @Pattern(regexp = EMAIL_PATTERN, message = "must be an email address") String email,
        @Size(max = 35) @Pattern(regexp = "[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*") String language,
        @Size(max = 200) String website
) {
    public static final String EMAIL_PATTERN = "^\\s*$|^\\s*[^\\s@]{1,64}@[^\\s@]+\\.[^\\s@]{2,}\\s*$";
}
