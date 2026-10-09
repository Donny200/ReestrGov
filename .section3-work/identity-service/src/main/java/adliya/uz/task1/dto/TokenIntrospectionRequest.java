package adliya.uz.task1.dto;

import jakarta.validation.constraints.NotBlank;

public record TokenIntrospectionRequest(
        @NotBlank(message = "Token is required") String token
) {
}
