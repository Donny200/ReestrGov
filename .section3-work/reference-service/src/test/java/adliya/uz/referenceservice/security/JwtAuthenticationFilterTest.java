package adliya.uz.referenceservice.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private SimpleJwtService jwtService;
    @Mock
    private IdentityTokenIntrospectionClient introspectionClient;
    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        TokenIntrospectionProperties properties = new TokenIntrospectionProperties();
        filter = new JwtAuthenticationFilter(jwtService, introspectionClient, properties);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void publicGetBypassesAuthenticationEvenWithStaleCookie() throws Exception {
        MockHttpServletRequest request = request(HttpMethod.GET, "/api/regions/10", "stale");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).parseAccessToken("stale");
        verify(introspectionClient, never()).introspect("stale");
    }

    @Test
    void mutatingPublicBasePathStillRequiresAuthentication() throws Exception {
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/interface-translations/uz", null);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void buildsPrincipalOnlyFromCanonicalIntrospectionResponse() throws Exception {
        AccessTokenMetadata metadata = new AccessTokenMetadata(7L, "user@example.com", 4L, "jti-1");
        TokenIntrospectionResponse introspection = active(4L);
        when(jwtService.parseAccessToken("valid")).thenReturn(metadata);
        when(introspectionClient.introspect("valid")).thenReturn(introspection);
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/interface-translations/uz", "valid");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        JwtPrincipal principal = (JwtPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        assertThat(principal.userId()).isEqualTo(7L);
        assertThat(principal.role()).isEqualTo("ROLE_SUPER_ADMIN");
        assertThat(principal.permissions()).containsExactly("TRANSLATIONS_WRITE");
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_SUPER_ADMIN", "TRANSLATIONS_WRITE");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void staleTokenVersionFailsClosedWithUnauthorized() throws Exception {
        when(jwtService.parseAccessToken("stale"))
                .thenReturn(new AccessTokenMetadata(7L, "user@example.com", 3L, "jti-1"));
        when(introspectionClient.introspect("stale")).thenReturn(active(4L));
        MockHttpServletRequest request = request(HttpMethod.DELETE, "/api/interface-translations/uz/key", "stale");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void disabledUserResponseFailsClosedWithUnauthorized() throws Exception {
        when(jwtService.parseAccessToken("disabled"))
                .thenReturn(new AccessTokenMetadata(7L, "user@example.com", 4L, "jti-1"));
        when(introspectionClient.introspect("disabled"))
                .thenReturn(new TokenIntrospectionResponse(
                        false, null, null, null, null, null, null, false, null, null));
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/interface-translations/uz", "disabled");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void identityOutageFailsClosedWithServiceUnavailable() throws Exception {
        when(jwtService.parseAccessToken("valid"))
                .thenReturn(new AccessTokenMetadata(7L, "user@example.com", 4L, "jti-1"));
        when(introspectionClient.introspect("valid"))
                .thenThrow(new IntrospectionUnavailableException("down"));
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/interface-translations/uz", "valid");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(503);
        verify(filterChain, never()).doFilter(request, response);
    }

    private TokenIntrospectionResponse active(long tokenVersion) {
        return new TokenIntrospectionResponse(
                true,
                7L,
                "user@example.com",
                "ROLE_SUPER_ADMIN",
                Set.of("TRANSLATIONS_WRITE"),
                Set.of(15L),
                tokenVersion,
                false,
                "jti-1",
                Instant.now().plusSeconds(60)
        );
    }

    private MockHttpServletRequest request(HttpMethod method, String path, String token) {
        MockHttpServletRequest request = new MockHttpServletRequest(method.name(), path);
        if (token != null) {
            request.setCookies(new jakarta.servlet.http.Cookie("accessToken", token));
        }
        return request;
    }
}
