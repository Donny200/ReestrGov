package adliya.uz.apigateway.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReactiveIdentityIntrospectionClientTest {

    @Test
    void sendsDistinctGatewayCredentialsToDirectEndpoint() {
        AtomicReference<String> path = new AtomicReference<>();
        AtomicReference<HttpHeaders> headers = new AtomicReference<>();
        String body = """
                {"active":true,"userId":7,"email":"user@example.com",\
                "role":"ROLE_SUPER_ADMIN","permissions":[],"organizationIds":[],\
                "tokenVersion":4,"mustChangePassword":false,"jti":"jti-1",\
                "expiresAt":"2030-01-01T00:00:00Z"}
                """;
        ExchangeFunction exchangeFunction = request -> {
            path.set(request.url().getPath());
            headers.set(request.headers());
            return Mono.just(ClientResponse.create(HttpStatus.OK)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(body)
                    .build());
        };
        WebClient webClient = WebClient.builder()
                .baseUrl("http://identity")
                .exchangeFunction(exchangeFunction)
                .build();
        ReactiveIdentityIntrospectionClient client = new ReactiveIdentityIntrospectionClient(
                webClient, "api-gateway", "gateway-key", Duration.ofSeconds(1));

        TokenIntrospectionResponse response = client.introspect("raw-token").block();

        assertThat(response).isNotNull();
        assertThat(response.active()).isTrue();
        assertThat(path.get()).isEqualTo("/internal/auth/introspect");
        assertThat(headers.get().getFirst("X-Service-Id")).isEqualTo("api-gateway");
        assertThat(headers.get().getFirst("X-Introspection-Key")).isEqualTo("gateway-key");
    }

    @Test
    void nonSuccessResponseIsUnavailable() {
        WebClient webClient = WebClient.builder()
                .baseUrl("http://identity")
                .exchangeFunction(request -> Mono.just(
                        ClientResponse.create(HttpStatus.UNAUTHORIZED).build()))
                .build();
        ReactiveIdentityIntrospectionClient client = new ReactiveIdentityIntrospectionClient(
                webClient, "api-gateway", "gateway-key", Duration.ofSeconds(1));

        assertThatThrownBy(() -> client.introspect("raw-token").block())
                .isInstanceOf(IntrospectionUnavailableException.class);
    }
}
