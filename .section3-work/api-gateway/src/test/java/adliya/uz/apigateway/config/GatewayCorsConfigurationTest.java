package adliya.uz.apigateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.cors.reactive.CorsWebFilter;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GatewayCorsConfigurationTest {

    @Test
    void preflightAllowsConfiguredOriginAndCsrfHeader() {
        CorsProperties properties = properties("https://app.example.test");
        CorsWebFilter filter = new GatewayCorsConfiguration().corsWebFilter(properties);
        AtomicBoolean forwarded = new AtomicBoolean();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.options("http://localhost/api/functions/7/requirements")
                        .header(HttpHeaders.ORIGIN, "https://app.example.test")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, HttpMethod.PUT.name())
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "X-XSRF-TOKEN, Content-Type")
                        .build()
        );

        filter.filter(exchange, current -> {
            forwarded.set(true);
            return current.getResponse().setComplete();
        }).block();

        assertThat(forwarded).isFalse();
        assertThat(exchange.getResponse().getHeaders().getAccessControlAllowOrigin())
                .isEqualTo("https://app.example.test");
        assertThat(exchange.getResponse().getHeaders().getAccessControlAllowCredentials()).isTrue();
        assertThat(exchange.getResponse().getHeaders().getAccessControlAllowHeaders())
                .contains("X-XSRF-TOKEN", "Content-Type");
    }

    @Test
    void requestFromUnlistedOriginIsRejected() {
        CorsWebFilter filter = new GatewayCorsConfiguration().corsWebFilter(
                properties("https://app.example.test")
        );
        AtomicBoolean forwarded = new AtomicBoolean();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/functions")
                        .header(HttpHeaders.ORIGIN, "https://evil.example.test")
                        .build()
        );

        filter.filter(exchange, current -> {
            forwarded.set(true);
            return current.getResponse().setComplete();
        }).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(exchange.getResponse().getHeaders().getAccessControlAllowOrigin()).isNull();
        assertThat(forwarded).isFalse();
    }

    @Test
    void wildcardOriginFailsClosed() {
        CorsProperties properties = properties("https://*.example.test");

        assertThatThrownBy(properties::requireExactOrigins)
                .isInstanceOf(IllegalStateException.class);
    }

    private CorsProperties properties(String... origins) {
        CorsProperties properties = new CorsProperties();
        properties.setAllowedOrigins(List.of(origins));
        return properties;
    }
}
