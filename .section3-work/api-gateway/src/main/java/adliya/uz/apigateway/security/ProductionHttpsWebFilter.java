package adliya.uz.apigateway.security;

import adliya.uz.apigateway.config.CorsProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
@Profile("prod")
public class ProductionHttpsWebFilter implements WebFilter, Ordered {

    static final String HSTS_HEADER = "Strict-Transport-Security";
    static final String HSTS_VALUE = "max-age=31536000; includeSubDomains";

    public ProductionHttpsWebFilter(CorsProperties corsProperties) {
        for (String origin : corsProperties.requireExactOrigins()) {
            if (!origin.regionMatches(true, 0, "https://", 0, "https://".length())) {
                throw new IllegalStateException("Production CORS origins must use HTTPS: " + origin);
            }
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        boolean secure = exchange.getRequest().getSslInfo() != null
                || "https".equalsIgnoreCase(exchange.getRequest().getURI().getScheme());
        if (!secure) {
            return rejectInsecureRequest(exchange);
        }

        exchange.getResponse().beforeCommit(() -> {
            if (!exchange.getResponse().getHeaders().containsKey(HSTS_HEADER)) {
                exchange.getResponse().getHeaders().set(HSTS_HEADER, HSTS_VALUE);
            }
            return Mono.empty();
        });
        return chain.filter(exchange);
    }

    private Mono<Void> rejectInsecureRequest(ServerWebExchange exchange) {
        byte[] body = "{\"status\":426,\"error\":\"Upgrade Required\",\"message\":\"HTTPS is required\"}"
                .getBytes(StandardCharsets.UTF_8);
        exchange.getResponse().setStatusCode(HttpStatus.UPGRADE_REQUIRED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
