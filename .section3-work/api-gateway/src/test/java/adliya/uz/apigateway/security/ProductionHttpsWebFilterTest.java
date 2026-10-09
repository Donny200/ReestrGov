package adliya.uz.apigateway.security;

import adliya.uz.apigateway.config.CorsProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionHttpsWebFilterTest {

    @Test
    void insecureRequestIsRejected() {
        ProductionHttpsWebFilter filter = new ProductionHttpsWebFilter(properties("https://app.example.test"));
        AtomicBoolean forwarded = new AtomicBoolean();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("http://gateway.example.test/api/functions").build()
        );

        filter.filter(exchange, current -> {
            forwarded.set(true);
            return current.getResponse().setComplete();
        }).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UPGRADE_REQUIRED);
        assertThat(forwarded).isFalse();
    }

    @Test
    void secureResponseIncludesHsts() {
        ProductionHttpsWebFilter filter = new ProductionHttpsWebFilter(properties("https://app.example.test"));
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("https://gateway.example.test/api/functions").build()
        );

        filter.filter(exchange, current -> {
            current.getResponse().setStatusCode(HttpStatus.OK);
            return current.getResponse().setComplete();
        }).block();

        assertThat(exchange.getResponse().getHeaders().getFirst(ProductionHttpsWebFilter.HSTS_HEADER))
                .isEqualTo(ProductionHttpsWebFilter.HSTS_VALUE);
    }

    @Test
    void productionRejectsHttpCorsOriginAtStartup() {
        assertThatThrownBy(() -> new ProductionHttpsWebFilter(properties("http://localhost:5173")))
                .isInstanceOf(IllegalStateException.class);
    }

    private CorsProperties properties(String origin) {
        CorsProperties properties = new CorsProperties();
        properties.setAllowedOrigins(List.of(origin));
        return properties;
    }
}
