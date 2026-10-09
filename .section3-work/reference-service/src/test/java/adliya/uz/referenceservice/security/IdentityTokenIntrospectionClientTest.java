package adliya.uz.referenceservice.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class IdentityTokenIntrospectionClientTest {

    private MockRestServiceServer server;
    private IdentityTokenIntrospectionClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://identity");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new IdentityTokenIntrospectionClient(
                builder.build(), "reference-service", "reference-key");
    }

    @Test
    void sendsDistinctServiceCredentialsAndTokenWithoutCaching() {
        String body = """
                {"active":true,"userId":7,"email":"user@example.com",\
                "role":"ROLE_SUPER_ADMIN","permissions":[],"organizationIds":[],\
                "tokenVersion":4,"mustChangePassword":false,"jti":"jti-1",\
                "expiresAt":"2030-01-01T00:00:00Z"}
                """;
        server.expect(once(), requestTo("http://identity/internal/auth/introspect"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("X-Service-Id", "reference-service"))
                .andExpect(header("X-Introspection-Key", "reference-key"))
                .andExpect(jsonPath("$.token").value("raw-token"))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        TokenIntrospectionResponse response = client.introspect("raw-token");

        assertThat(response.active()).isTrue();
        assertThat(response.userId()).isEqualTo(7L);
        server.verify();
    }

    @Test
    void nonSuccessFromIdentityIsAvailabilityFailure() {
        server.expect(requestTo("http://identity/internal/auth/introspect"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> client.introspect("raw-token"))
                .isInstanceOf(IntrospectionUnavailableException.class)
                .hasMessage("Identity introspection is unavailable");
    }
}
