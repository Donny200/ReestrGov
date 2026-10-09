package adliya.uz.task1.dto;

import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private Boolean enabled;
    private Boolean mustChangePassword;
    private LocalDateTime createdAt;
    private Set<Long> organizationIds;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .enabled(user.getEnabled())
                .mustChangePassword(user.getMustChangePassword())
                .createdAt(user.getCreatedAt())
                .organizationIds(user.getOrganizations().stream()
                        .map(Organization::getId)
                        .collect(Collectors.toSet()))
                .build();
    }
}
