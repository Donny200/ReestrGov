package adliya.uz.task1.controller;

import adliya.uz.task1.config.CorsProperties;
import adliya.uz.task1.config.SecurityConfig;
import adliya.uz.task1.config.security.CookieProperties;
import adliya.uz.task1.config.security.CustomUserDetailsService;
import adliya.uz.task1.config.security.InternalClientAuthenticationFilter;
import adliya.uz.task1.config.security.InternalIntrospectionProperties;
import adliya.uz.task1.config.security.JwtAuthenticationFilter;
import adliya.uz.task1.config.security.JwtService;
import adliya.uz.task1.dto.UserResponse;
import adliya.uz.task1.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(
        controllers = UserController.class,
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false"
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, InternalClientAuthenticationFilter.class})
class UserControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private CookieProperties cookieProperties;

    @MockitoBean
    private CorsProperties corsProperties;

    @MockitoBean
    private AuthenticationProvider authenticationProvider;

    @MockitoBean
    private InternalIntrospectionProperties internalIntrospectionProperties;

    @Test
    @WithMockUser(username = "org-admin@example.com", roles = "ORG_ADMIN")
    void everyLegacyUserOperationIsForbiddenWithoutSuperAdminRole() throws Exception {
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/user/7"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/user").with(csrf())
                        .contentType("application/json")
                        .content(validCreateRequest()))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/user/7").with(csrf())
                        .contentType("application/json")
                        .content("{\"firstName\":\"Updated\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/user/7").with(csrf()))
                .andExpect(status().isForbidden());

        verifyNoInteractions(userService);
    }

    @Test
    void anonymousUserCannotAccessLegacyUserApi() throws Exception {
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(userService);
    }

    @Test
    @WithMockUser(username = "root@example.com", roles = "SUPER_ADMIN")
    void passwordNeverAppearsInAnyLegacyUserResponse() throws Exception {
        UserResponse response = response();
        when(userService.getAllForLegacyApi()).thenReturn(List.of(response));
        when(userService.getForLegacyApi(7L)).thenReturn(response);
        when(userService.create(any())).thenReturn(response);
        when(userService.update(eq(7L), any())).thenReturn(response);

        mockMvc.perform(get("/api/user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..password").doesNotExist());
        mockMvc.perform(get("/api/user/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..password").doesNotExist());
        mockMvc.perform(post("/api/user").with(csrf())
                        .contentType("application/json")
                        .content(validCreateRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$..password").doesNotExist());
        mockMvc.perform(put("/api/user/7").with(csrf())
                        .contentType("application/json")
                        .content("{\"firstName\":\"Updated\",\"password\":\"NewPassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..password").doesNotExist());
    }

    @Test
    @WithMockUser(username = "root@example.com", roles = "SUPER_ADMIN")
    void superAdminDeleteSoftDeactivatesAndReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/user/7").with(csrf()))
                .andExpect(status().isNoContent());

        verify(userService).deactivate(7L);
    }

    private String validCreateRequest() {
        return """
                {
                  "firstName": "Alice",
                  "lastName": "Admin",
                  "email": "alice@example.com",
                  "password": "StrongPassword123",
                  "phone": "+998901234567",
                  "roleId": 3,
                  "organizationIds": [10]
                }
                """;
    }

    private UserResponse response() {
        return UserResponse.builder()
                .id(7L)
                .firstName("Alice")
                .lastName("Admin")
                .email("alice@example.com")
                .phone("+998901234567")
                .role("ROLE_ORG_ADMIN")
                .enabled(true)
                .createdAt(LocalDateTime.of(2026, 8, 25, 10, 0))
                .organizationIds(Set.of(10L))
                .build();
    }
}
