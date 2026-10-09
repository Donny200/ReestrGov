package adliya.uz.functioncatalogservice.security;

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
import java.util.List;
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
        filter = new JwtAuthenticationFilter(
                jwtService, introspectionClient, new TokenIntrospectionProperties());
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void publicGetBypassesAuthenticationEvenWithStaleCookie() throws Exception {
        MockHttpServletRequest request = request(HttpMethod.GET, "/api/functions/10", "stale");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).parseAccessToken("stale");
        verify(introspectionClient, never()).introspect("stale");
    }

    @Test
    void postOnPublicReadPathStillRequiresAuthentication() throws Exception {
        MockHttpServletRequest request = request(HttpMethod.POST, "/api/functions", null);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void canonicalOrganizationScopeComesFromIntrospection() throws Exception {
        when(jwtService.parseAccessToken("valid"))
                .thenReturn(new AccessTokenMetadata(7L, "user@example.com", 4L, "jti-1"));
        when(introspectionClient.introspect("valid")).thenReturn(active(4L));
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/functions/1", "valid");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        JwtPrincipal principal = (JwtPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        assertThat(principal.organizationIds()).containsExactly(15L, 16L);
        assertThat(principal.permissions()).containsExactly("FUNCTIONS_WRITE");
        assertThat(SecurityContextHolder.getContext().getAuthentication().getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_ORG_ADMIN", "FUNCTIONS_WRITE");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void staleTokenVersionFailsClosedWithUnauthorized() throws Exception {
        when(jwtService.parseAccessToken("stale"))
                .thenReturn(new AccessTokenMetadata(7L, "user@example.com", 3L, "jti-1"));
        when(introspectionClient.introspect("stale")).thenReturn(active(4L));
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/functions/1", "stale");
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
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/functions/1", "disabled");
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
        MockHttpServletRequest request = request(HttpMethod.PUT, "/api/functions/1", "valid");
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
                "ROLE_ORG_ADMIN",
                Set.of("FUNCTIONS_WRITE"),
                List.of(15L, 16L),
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
