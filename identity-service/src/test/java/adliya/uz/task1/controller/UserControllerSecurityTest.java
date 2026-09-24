package adliya.uz.task1.controller;

import adliya.uz.task1.config.CorsProperties;
import adliya.uz.task1.config.SecurityConfig;
import adliya.uz.task1.config.security.CookieProperties;
import adliya.uz.task1.config.security.CustomUserDetailsService;
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

@WebMvcTest(
        controllers = UserController.class,
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false"
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
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

    @Test
    @WithMockUser(username = "viewer@example.com", authorities = "USERS_VIEW")
    void usersViewPermissionCanReadButCannotMutate() throws Exception {
        when(userService.getAllForLegacyApi()).thenReturn(List.of());
        when(userService.getForLegacyApi(7L)).thenReturn(response());

        mockMvc.perform(get("/api/user"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/user/7"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/user")
                        .contentType("application/json")
                        .content(validCreateRequest()))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/user/7")
                        .contentType("application/json")
                        .content("{\"firstName\":\"Updated\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/user/7"))
                .andExpect(status().isForbidden());

        verify(userService).getAllForLegacyApi();
        verify(userService).getForLegacyApi(7L);
    }

    @Test
    @WithMockUser(username = "creator@example.com", authorities = "USERS_CREATE")
    void usersCreatePermissionCanCreateButCannotRead() throws Exception {
        when(userService.create(any())).thenReturn(response());

        mockMvc.perform(post("/api/user")
                        .contentType("application/json")
                        .content(validCreateRequest()))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isForbidden());

        verify(userService).create(any());
    }

    @Test
    @WithMockUser(username = "editor@example.com", authorities = "USERS_EDIT")
    void usersEditPermissionCanUpdateButCannotDeactivate() throws Exception {
        when(userService.update(eq(7L), any())).thenReturn(response());

        mockMvc.perform(put("/api/user/7")
                        .contentType("application/json")
                        .content("{\"firstName\":\"Updated\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/user/7"))
                .andExpect(status().isForbidden());

        verify(userService).update(eq(7L), any());
    }

    @Test
    void anonymousUserCannotAccessLegacyUserApi() throws Exception {
        mockMvc.perform(get("/api/user"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(userService);
    }

    @Test
    @WithMockUser(username = "root@example.com", authorities = {
            "ROLE_SUPER_ADMIN", "USERS_VIEW", "USERS_CREATE", "USERS_EDIT"
    })
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
        mockMvc.perform(post("/api/user")
                        .contentType("application/json")
                        .content(validCreateRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$..password").doesNotExist());
        mockMvc.perform(put("/api/user/7")
                        .contentType("application/json")
                        .content("{\"firstName\":\"Updated\",\"password\":\"NewPassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..password").doesNotExist());
    }

    @Test
    @WithMockUser(username = "manager@example.com", authorities = "USERS_DEACTIVATE")
    void superAdminDeleteSoftDeactivatesAndReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/user/7"))
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
