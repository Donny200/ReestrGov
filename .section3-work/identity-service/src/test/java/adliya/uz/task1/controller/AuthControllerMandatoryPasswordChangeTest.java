package adliya.uz.task1.controller;

import adliya.uz.task1.config.security.CookieUtil;
import adliya.uz.task1.config.security.CustomUserPrincipal;
import adliya.uz.task1.config.security.JwtService;
import adliya.uz.task1.config.security.MandatoryPasswordChangeFilter;
import adliya.uz.task1.dto.UserResponse;
import adliya.uz.task1.entity.Role;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.InvalidRefreshTokenException;
import adliya.uz.task1.service.AuthService;
import adliya.uz.task1.service.RefreshTokenService;
import jakarta.servlet.Filter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@ExtendWith(MockitoExtension.class)
class AuthControllerMandatoryPasswordChangeTest {

    @Mock
    private AuthService authService;

    @Mock
    private JwtService jwtService;

    @Mock
    private CookieUtil cookieUtil;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Test
    void flaggedUserIsDeniedEveryOtherEndpoint() throws Exception {
        flaggedMockMvc().perform(get("/api/private-resource"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message")
                        .value("Password must be changed before accessing this resource"));
    }

    @Test
    void flaggedUserCanChangePasswordReadProfileAndLogout() throws Exception {
        User changedUser = user(false);
        when(authService.changePassword(any())).thenReturn(changedUser);
        when(authService.getCurrentUser()).thenReturn(UserResponse.builder()
                .id(1L)
                .email("root@example.com")
                .mustChangePassword(true)
                .organizationIds(Set.of())
                .build());
        when(jwtService.generateToken(changedUser)).thenReturn("new-access-value");
        when(refreshTokenService.createRefreshToken(changedUser)).thenReturn("new-refresh-value");
        when(cookieUtil.createAccessCookie("new-access-value"))
                .thenReturn(sessionCookie("accessToken", "new-access-value", "/"));
        when(cookieUtil.createRefreshCookie("new-refresh-value"))
                .thenReturn(sessionCookie("refreshToken", "new-refresh-value", "/api/auth"));
        when(cookieUtil.createLogoutAccessCookie()).thenReturn(logoutCookie("accessToken", "/"));
        when(cookieUtil.createLogoutRefreshCookie()).thenReturn(logoutCookie("refreshToken", "/api/auth"));
        MockMvc mockMvc = flaggedMockMvc();

        MvcResult passwordChange = mockMvc.perform(post("/api/auth/change-password").with(csrf())
                        .contentType("application/json")
                        .content("""
                                {
                                  "currentPassword": "TemporaryPassword123",
                                  "newPassword": "PermanentPassword456"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(passwordChange.getResponse().getHeaders(HttpHeaders.SET_COOKIE))
                .anyMatch(cookie -> cookie.startsWith("accessToken=new-access-value"))
                .anyMatch(cookie -> cookie.startsWith("refreshToken=new-refresh-value"));
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(true));
        mockMvc.perform(post("/api/auth/logout").with(csrf()))
                .andExpect(status().isOk());

        verify(authService).changePassword(any());
    }

    @Test
    void flaggedLoginIssuesAccessCookieAndClearsRatherThanIssuesRefreshToken() throws Exception {
        User user = user(true);
        when(authService.login(any())).thenReturn(user);
        when(jwtService.generateToken(user)).thenReturn("access-value");
        when(cookieUtil.createAccessCookie("access-value"))
                .thenReturn(sessionCookie("accessToken", "access-value", "/"));
        when(cookieUtil.createLogoutRefreshCookie())
                .thenReturn(logoutCookie("refreshToken", "/api/auth"));

        MvcResult result = baseMockMvc().perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(loginRequest()))
                .andExpect(status().isOk())
                .andReturn();

        List<String> cookies = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(cookies).anyMatch(cookie -> cookie.startsWith("accessToken=access-value"));
        assertThat(cookies).anyMatch(cookie -> cookie.startsWith("refreshToken=")
                && cookie.contains("Max-Age=0"));
        assertThat(cookies).noneMatch(cookie -> cookie.startsWith("refreshToken=")
                && !cookie.contains("Max-Age=0"));
        verify(refreshTokenService, never()).createRefreshToken(any());
    }

    @Test
    void refreshWithoutAccessCookieIsRejectedWhenStoredSessionRequiresPasswordChange() throws Exception {
        when(refreshTokenService.rotate("old-refresh"))
                .thenThrow(new InvalidRefreshTokenException("Password change is required"));
        when(cookieUtil.createLogoutAccessCookie()).thenReturn(logoutCookie("accessToken", "/"));
        when(cookieUtil.createLogoutRefreshCookie()).thenReturn(logoutCookie("refreshToken", "/api/auth"));

        assertThat(controller().refresh("old-refresh").getStatusCode().value()).isEqualTo(401);

        verify(refreshTokenService).rotate("old-refresh");
    }

    @Test
    void ordinaryLoginStillIssuesAccessAndRefreshCookies() throws Exception {
        User user = user(false);
        when(authService.login(any())).thenReturn(user);
        when(jwtService.generateToken(user)).thenReturn("access-value");
        when(refreshTokenService.createRefreshToken(user)).thenReturn("refresh-value");
        when(cookieUtil.createAccessCookie("access-value"))
                .thenReturn(sessionCookie("accessToken", "access-value", "/"));
        when(cookieUtil.createRefreshCookie("refresh-value"))
                .thenReturn(sessionCookie("refreshToken", "refresh-value", "/api/auth"));

        MvcResult result = baseMockMvc().perform(post("/api/auth/login").with(csrf())
                        .contentType("application/json")
                        .content(loginRequest()))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getHeaders(HttpHeaders.SET_COOKIE))
                .anyMatch(cookie -> cookie.startsWith("accessToken=access-value"))
                .anyMatch(cookie -> cookie.startsWith("refreshToken=refresh-value"));
    }

    @Test
    void ordinaryAuthenticatedUserIsNotRestrictedByPasswordChangeGate() throws Exception {
        mockMvcWithPrincipal(false).perform(get("/api/private-resource"))
                .andExpect(status().isNotFound());
    }

    private MockMvc baseMockMvc() {
        return MockMvcBuilders.standaloneSetup(controller())
                .addPlaceholderValue("app.cookie.refresh-token-name", "refreshToken")
                .build();
    }

    private MockMvc flaggedMockMvc() {
        return mockMvcWithPrincipal(true);
    }

    private MockMvc mockMvcWithPrincipal(boolean mustChangePassword) {
        Filter authenticationFilter = (request, response, chain) -> {
            CustomUserPrincipal principal = new CustomUserPrincipal(
                    1L,
                    "root@example.com",
                    "hash",
                    List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")),
                    true,
                    mustChangePassword,
                    0L
            );
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(
                            principal,
                            null,
                            principal.getAuthorities()
                    )
            );
            try {
                chain.doFilter(request, response);
            } finally {
                SecurityContextHolder.clearContext();
            }
        };

        return MockMvcBuilders.standaloneSetup(controller())
                .addPlaceholderValue("app.cookie.refresh-token-name", "refreshToken")
                .addFilters(authenticationFilter, new MandatoryPasswordChangeFilter())
                .build();
    }

    private AuthController controller() {
        return new AuthController(authService, jwtService, cookieUtil, refreshTokenService);
    }

    private User user(boolean mustChangePassword) {
        return User.builder()
                .id(1L)
                .firstName("Root")
                .lastName("Admin")
                .email("root@example.com")
                .password("hash")
                .role(Role.builder().name("ROLE_SUPER_ADMIN").build())
                .enabled(true)
                .mustChangePassword(mustChangePassword)
                .organizations(Set.of())
                .build();
    }

    private ResponseCookie sessionCookie(String name, String value, String path) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .path(path)
                .build();
    }

    private ResponseCookie logoutCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .path(path)
                .maxAge(0)
                .build();
    }

    private String loginRequest() {
        return """
                {
                  "email": "root@example.com",
                  "password": "TemporaryPassword123"
                }
                """;
    }
}
