package adliya.uz.task1.controller;

import adliya.uz.task1.config.CorsProperties;
import adliya.uz.task1.config.SecurityConfig;
import adliya.uz.task1.config.security.CookieProperties;
import adliya.uz.task1.config.security.CookieUtil;
import adliya.uz.task1.config.security.CustomUserDetailsService;
import adliya.uz.task1.config.security.InternalClientAuthenticationFilter;
import adliya.uz.task1.config.security.InternalIntrospectionProperties;
import adliya.uz.task1.config.security.JwtAuthenticationFilter;
import adliya.uz.task1.config.security.JwtService;
import adliya.uz.task1.service.AuthService;
import adliya.uz.task1.service.RefreshTokenService;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AuthController.class,
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false"
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, InternalClientAuthenticationFilter.class})
class CsrfSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CookieUtil cookieUtil;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private InternalIntrospectionProperties internalIntrospectionProperties;

    @MockitoBean
    private AuthenticationProvider authenticationProvider;

    @MockitoBean
    private CookieProperties cookieProperties;

    @MockitoBean
    private CorsProperties corsProperties;

    @BeforeEach
    void configureSecurityProperties() {
        when(cookieProperties.isSecure()).thenReturn(true);
        when(cookieProperties.getSameSite()).thenReturn("Strict");
        when(cookieProperties.getAccessTokenName()).thenReturn("accessToken");
        when(corsProperties.requireExactOrigins()).thenReturn(List.of("https://app.example.test"));
    }

    @Test
    void loginWithoutCsrfTokenIsRejectedBeforeAuthentication() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(loginRequest()))
                .andExpect(status().isForbidden());

        verifyNoInteractions(authService);
    }

    @Test
    void loginWithMismatchedCookieAndHeaderIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .cookie(new Cookie("XSRF-TOKEN", "cookie-token"))
                        .header("X-XSRF-TOKEN", "different-header-token")
                        .contentType("application/json")
                        .content(loginRequest()))
                .andExpect(status().isForbidden());

        verifyNoInteractions(authService);
    }

    @Test
    void bootstrapReturnsRawTokenMatchingReadableSecureCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andReturn();

        String rawToken = JsonPath.read(result.getResponse().getContentAsString(), "$.token");
        String setCookie = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(value -> value.startsWith("XSRF-TOKEN="))
                .findFirst()
                .orElseThrow();

        assertThat(setCookie)
                .contains("XSRF-TOKEN=" + rawToken)
                .contains("Path=/")
                .contains("Secure")
                .doesNotContain("HttpOnly");
        assertThat(result.getResponse().getHeader(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store");
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
