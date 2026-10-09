package adliya.uz.functioncatalogservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRequirementsRequest {

    @NotBlank(message = "Requirements text is required")
    private String requirements;
}
