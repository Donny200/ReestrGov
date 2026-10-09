package adliya.uz.functioncatalogservice.security;

import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

@Component
public class IdentityTokenIntrospectionClient {

    static final String SERVICE_ID_HEADER = "X-Service-Id";
    static final String SERVICE_KEY_HEADER = "X-Introspection-Key";
    static final String INTROSPECTION_PATH = "/internal/auth/introspect";

    private final RestClient restClient;
    private final String clientId;
    private final String clientKey;

    public IdentityTokenIntrospectionClient(
            RestClient.Builder restClientBuilder,
            TokenIntrospectionProperties properties
    ) {
        this(
                buildRestClient(restClientBuilder, properties),
                requireText(properties.getClientId(), "Introspection client ID is required"),
                requireText(properties.getClientKey(), "Introspection client key is required")
        );
    }

    IdentityTokenIntrospectionClient(RestClient restClient, String clientId, String clientKey) {
        this.restClient = restClient;
        this.clientId = requireText(clientId, "Introspection client ID is required");
        this.clientKey = requireText(clientKey, "Introspection client key is required");
    }

    public TokenIntrospectionResponse introspect(String token) {
        try {
            TokenIntrospectionResponse response = restClient.post()
                    .uri(INTROSPECTION_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(SERVICE_ID_HEADER, clientId)
                    .header(SERVICE_KEY_HEADER, clientKey)
                    .body(new TokenIntrospectionRequest(token))
                    .retrieve()
                    .body(TokenIntrospectionResponse.class);

            if (response == null) {
                throw new IntrospectionUnavailableException("Identity introspection returned an empty response");
            }
            return response;
        } catch (IntrospectionUnavailableException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new IntrospectionUnavailableException("Identity introspection is unavailable", exception);
        }
    }

    private static RestClient buildRestClient(
            RestClient.Builder builder,
            TokenIntrospectionProperties properties
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(toMillis(properties.getConnectTimeout(), "connect timeout"));
        requestFactory.setReadTimeout(toMillis(properties.getReadTimeout(), "read timeout"));

        return builder
                .baseUrl(requireText(properties.getBaseUrl(), "Identity introspection base URL is required"))
                .requestFactory(requestFactory)
                .build();
    }

    private static int toMillis(Duration duration, String name) {
        if (duration == null || duration.isZero() || duration.isNegative()
                || duration.toMillis() > Integer.MAX_VALUE) {
            throw new IllegalStateException("Introspection " + name + " must be a positive duration");
        }
        return Math.toIntExact(duration.toMillis());
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(message);
        }
        return value.trim();
    }
}
