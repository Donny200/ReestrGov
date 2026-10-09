package adliya.uz.apigateway.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenAuthorizationGlobalFilterTest {

    @Mock
    private ReactiveIdentityIntrospectionClient introspectionClient;
    @Mock
    private GatewayFilterChain chain;

    private TokenAuthorizationGlobalFilter filter;

    @BeforeEach
    void setUp() {
        GatewayIntrospectionProperties properties = new GatewayIntrospectionProperties();
        filter = new TokenAuthorizationGlobalFilter(
                introspectionClient, properties, new PublicRoutePolicy());
    }

    @Test
    void publicRequestBypassesIntrospectionAndStripsSpoofedHeaders() {
        when(chain.filter(any())).thenReturn(Mono.empty());
        MockServerWebExchange exchange = exchange(
                HttpMethod.GET, "/api/functions/1", "stale", true);

        filter.filter(exchange, chain).block();

        ArgumentCaptor<ServerWebExchange> captor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(chain).filter(captor.capture());
        verify(introspectionClient, never()).introspect(any());
        HttpHeaders forwarded = captor.getValue().getRequest().getHeaders();
        assertThat(forwarded.containsKey("X-User-Role")).isFalse();
        assertThat(forwarded.containsKey("X-Auth-Context")).isFalse();
        assertThat(forwarded.containsKey("X-Introspection-Key")).isFalse();
    }

    @Test
    void protectedRequestWithoutCookieIsUnauthorized() {
        MockServerWebExchange exchange = exchange(
                HttpMethod.POST, "/api/functions", null, false);

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
        verify(introspectionClient, never()).introspect(any());
    }

    @Test
    void activeCanonicalTokenIsForwarded() {
        when(introspectionClient.introspect("valid")).thenReturn(Mono.just(active(false)));
        when(chain.filter(any())).thenReturn(Mono.empty());
        MockServerWebExchange exchange = exchange(
                HttpMethod.POST, "/api/functions", "valid", false);

        filter.filter(exchange, chain).block();

        verify(chain).filter(any());
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void mandatoryPasswordTokenCanReachOnlyRecoveryRoutes() {
        when(introspectionClient.introspect("change-required"))
                .thenReturn(Mono.just(active(true)), Mono.just(active(true)));
        when(chain.filter(any())).thenReturn(Mono.empty());
        MockServerWebExchange me = exchange(
                HttpMethod.GET, "/api/auth/me", "change-required", false);
        MockServerWebExchange business = exchange(
                HttpMethod.POST, "/api/functions", "change-required", false);

        filter.filter(me, chain).block();
        filter.filter(business, chain).block();

        verify(chain).filter(any());
        assertThat(me.getResponse().getStatusCode()).isNull();
        assertThat(business.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void disabledOrRevokedTokenIsUnauthorized() {
        when(introspectionClient.introspect("disabled")).thenReturn(Mono.just(inactive()));
        MockServerWebExchange exchange = exchange(
                HttpMethod.PUT, "/api/functions/1", "disabled", false);

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }

    @Test
    void identityOutageIsServiceUnavailableRatherThanAuthenticationFailure() {
        when(introspectionClient.introspect("valid"))
                .thenReturn(Mono.error(new IntrospectionUnavailableException("down")));
        MockServerWebExchange exchange = exchange(
                HttpMethod.PUT, "/api/functions/1", "valid", false);

        filter.filter(exchange, chain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        verify(chain, never()).filter(any());
    }

    private TokenIntrospectionResponse active(boolean mustChangePassword) {
        return new TokenIntrospectionResponse(
                true,
                7L,
                "user@example.com",
                "ROLE_ORG_ADMIN",
                Set.of("FUNCTIONS_WRITE"),
                Set.of(15L),
                4L,
                mustChangePassword,
                "jti-1",
                Instant.now().plusSeconds(60)
        );
    }

    private TokenIntrospectionResponse inactive() {
        return new TokenIntrospectionResponse(
                false, null, null, null, null, null, null, false, null, null);
    }

    private MockServerWebExchange exchange(
            HttpMethod method,
            String path,
            String token,
            boolean spoofHeaders
    ) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.method(method, path);
        if (token != null) {
            builder.cookie(new HttpCookie("accessToken", token));
        }
        if (spoofHeaders) {
            builder.header("X-User-Role", "ROLE_SUPER_ADMIN")
                    .header("X-Auth-Context", "spoofed")
                    .header("X-Introspection-Key", "spoofed-key");
        }
        return MockServerWebExchange.from(builder.build());
    }
}
