package adliya.uz.apigateway.security;

import io.netty.channel.ChannelOption;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Component
public class ReactiveIdentityIntrospectionClient {

    static final String SERVICE_ID_HEADER = "X-Service-Id";
    static final String SERVICE_KEY_HEADER = "X-Introspection-Key";
    static final String INTROSPECTION_PATH = "/internal/auth/introspect";

    private final WebClient webClient;
    private final String clientId;
    private final String clientKey;
    private final Duration readTimeout;

    public ReactiveIdentityIntrospectionClient(
            WebClient.Builder webClientBuilder,
            GatewayIntrospectionProperties properties
    ) {
        this(
                buildWebClient(webClientBuilder, properties),
                requireText(properties.getClientId(), "Introspection client ID is required"),
                requireText(properties.getClientKey(), "Introspection client key is required"),
                requirePositiveDuration(properties.getReadTimeout(), "read timeout")
        );
    }

    ReactiveIdentityIntrospectionClient(
            WebClient webClient,
            String clientId,
            String clientKey,
            Duration readTimeout
    ) {
        this.webClient = webClient;
        this.clientId = requireText(clientId, "Introspection client ID is required");
        this.clientKey = requireText(clientKey, "Introspection client key is required");
        this.readTimeout = requirePositiveDuration(readTimeout, "read timeout");
    }

    public Mono<TokenIntrospectionResponse> introspect(String token) {
        return webClient.post()
                .uri(INTROSPECTION_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .header(SERVICE_ID_HEADER, clientId)
                .header(SERVICE_KEY_HEADER, clientKey)
                .bodyValue(new TokenIntrospectionRequest(token))
                .exchangeToMono(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.bodyToMono(TokenIntrospectionResponse.class)
                                .switchIfEmpty(Mono.error(new IntrospectionUnavailableException(
                                        "Identity introspection returned an empty response")));
                    }
                    return response.releaseBody().then(Mono.error(
                            new IntrospectionUnavailableException("Identity introspection rejected the service call")
                    ));
                })
                .timeout(readTimeout)
                .onErrorMap(
                        exception -> !(exception instanceof IntrospectionUnavailableException),
                        exception -> new IntrospectionUnavailableException(
                                "Identity introspection is unavailable", exception)
                );
    }

    private static WebClient buildWebClient(
            WebClient.Builder builder,
            GatewayIntrospectionProperties properties
    ) {
        Duration connectTimeout = requirePositiveDuration(properties.getConnectTimeout(), "connect timeout");
        Duration readTimeout = requirePositiveDuration(properties.getReadTimeout(), "read timeout");
        if (connectTimeout.toMillis() > Integer.MAX_VALUE) {
            throw new IllegalStateException("Introspection connect timeout is too large");
        }

        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, Math.toIntExact(connectTimeout.toMillis()))
                .responseTimeout(readTimeout);

        return builder
                .baseUrl(requireText(properties.getBaseUrl(), "Identity introspection base URL is required"))
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    private static Duration requirePositiveDuration(Duration value, String name) {
        if (value == null || value.isZero() || value.isNegative()) {
            throw new IllegalStateException("Introspection " + name + " must be a positive duration");
        }
        return value;
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(message);
        }
        return value.trim();
    }
}
