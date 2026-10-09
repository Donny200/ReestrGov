package adliya.uz.apigateway.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;

@Component
public class CsrfProtectionGlobalFilter implements GlobalFilter, Ordered {

    static final String CSRF_COOKIE_NAME = "XSRF-TOKEN";
    static final String CSRF_HEADER_NAME = "X-XSRF-TOKEN";

    private static final Set<HttpMethod> SAFE_METHODS = Set.of(
            HttpMethod.GET,
            HttpMethod.HEAD,
            HttpMethod.OPTIONS,
            HttpMethod.TRACE
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        HttpMethod method = exchange.getRequest().getMethod();
        String path = exchange.getRequest().getPath().pathWithinApplication().value();

        if (method == null || SAFE_METHODS.contains(method) || !isPublicApiPath(path)) {
            return chain.filter(exchange);
        }

        HttpCookie csrfCookie = exchange.getRequest().getCookies().getFirst(CSRF_COOKIE_NAME);
        String headerToken = exchange.getRequest().getHeaders().getFirst(CSRF_HEADER_NAME);
        if (csrfCookie == null || headerToken == null || !tokensMatch(csrfCookie.getValue(), headerToken)) {
            return reject(exchange);
        }

        return chain.filter(exchange);
    }

    private boolean isPublicApiPath(String path) {
        return "/api".equals(path) || path.startsWith("/api/");
    }

    private boolean tokensMatch(String cookieToken, String headerToken) {
        return MessageDigest.isEqual(
                cookieToken.getBytes(StandardCharsets.UTF_8),
                headerToken.getBytes(StandardCharsets.UTF_8)
        );
    }

    private Mono<Void> reject(ServerWebExchange exchange) {
        byte[] body = "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"Invalid CSRF token\"}"
                .getBytes(StandardCharsets.UTF_8);
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }
}
