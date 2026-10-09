package adliya.uz.apigateway.security;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Locale;

@Component
public class TokenAuthorizationGlobalFilter implements GlobalFilter, Ordered {

    private final ReactiveIdentityIntrospectionClient introspectionClient;
    private final GatewayIntrospectionProperties properties;
    private final PublicRoutePolicy publicRoutePolicy;

    public TokenAuthorizationGlobalFilter(
            ReactiveIdentityIntrospectionClient introspectionClient,
            GatewayIntrospectionProperties properties
    ) {
        this(introspectionClient, properties, new PublicRoutePolicy());
    }

    TokenAuthorizationGlobalFilter(
            ReactiveIdentityIntrospectionClient introspectionClient,
            GatewayIntrospectionProperties properties,
            PublicRoutePolicy publicRoutePolicy
    ) {
        this.introspectionClient = introspectionClient;
        this.properties = properties;
        this.publicRoutePolicy = publicRoutePolicy;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerWebExchange sanitizedExchange = stripSpoofableHeaders(exchange);
        PublicRoutePolicy.AuthorizationRequirement requirement = publicRoutePolicy.requirement(
                sanitizedExchange.getRequest().getMethod(),
                sanitizedExchange.getRequest().getPath().pathWithinApplication().value()
        );

        if (requirement == PublicRoutePolicy.AuthorizationRequirement.PUBLIC) {
            return chain.filter(sanitizedExchange);
        }

        HttpCookie cookie = sanitizedExchange.getRequest().getCookies()
                .getFirst(properties.getAccessTokenCookieName());
        if (cookie == null || cookie.getValue().isBlank()) {
            return writeError(sanitizedExchange, HttpStatus.UNAUTHORIZED, "A valid access token is required");
        }

        return introspectionClient.introspect(cookie.getValue())
                .flatMap(response -> {
                    boolean passwordStateAccepted =
                            requirement == PublicRoutePolicy.AuthorizationRequirement.ACTIVE_ALLOW_PASSWORD_CHANGE
                                    || !response.mustChangePassword();
                    if (!response.active() || !response.hasCanonicalIdentity() || !passwordStateAccepted) {
                        return writeError(sanitizedExchange, HttpStatus.UNAUTHORIZED, "Access token is inactive");
                    }
                    return chain.filter(sanitizedExchange);
                })
                .onErrorResume(
                        IntrospectionUnavailableException.class,
                        exception -> writeError(
                                sanitizedExchange,
                                HttpStatus.SERVICE_UNAVAILABLE,
                                "Authentication service is unavailable"
                        )
                );
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }

    private ServerWebExchange stripSpoofableHeaders(ServerWebExchange exchange) {
        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    for (String name : new ArrayList<>(headers.keySet())) {
                        String normalized = name.toLowerCase(Locale.ROOT);
                        if (normalized.startsWith("x-user-")
                                || normalized.startsWith("x-auth-")
                                || normalized.startsWith("x-token-")
                                || normalized.equals("x-role")
                                || normalized.equals("x-permissions")
                                || normalized.equals("x-organization-ids")
                                || normalized.equals("x-service-id")
                                || normalized.equals("x-introspection-key")) {
                            headers.remove(name);
                        }
                    }
                })
                .build();
        return exchange.mutate().request(request).build();
    }

    private Mono<Void> writeError(ServerWebExchange exchange, HttpStatus status, String message) {
        if (exchange.getResponse().isCommitted()) {
            return Mono.empty();
        }

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"status\":" + status.value()
                + ",\"error\":\"" + status.getReasonPhrase()
                + "\",\"message\":\"" + message + "\"}")
                .getBytes(StandardCharsets.UTF_8);
        exchange.getResponse().getHeaders().setContentLength(body.length);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(body);
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
