package adliya.uz.apigateway.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;

class CsrfProtectionGlobalFilterTest {

    private final CsrfProtectionGlobalFilter filter = new CsrfProtectionGlobalFilter();

    @Test
    void unsafeApiRequestWithoutTokenIsRejected() {
        AtomicBoolean forwarded = new AtomicBoolean();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/auth/login").build()
        );

        filter.filter(exchange, current -> {
            forwarded.set(true);
            return current.getResponse().setComplete();
        }).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forwarded).isFalse();
    }

    @Test
    void unsafeApiRequestWithMatchingCookieAndHeaderIsForwarded() {
        AtomicBoolean forwarded = new AtomicBoolean();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/auth/login")
                        .cookie(new HttpCookie(CsrfProtectionGlobalFilter.CSRF_COOKIE_NAME, "csrf-value"))
                        .header(CsrfProtectionGlobalFilter.CSRF_HEADER_NAME, "csrf-value")
                        .build()
        );

        filter.filter(exchange, current -> {
            forwarded.set(true);
            return current.getResponse().setComplete();
        }).block();

        assertThat(forwarded).isTrue();
        assertThat(exchange.getResponse().getStatusCode()).isNotEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void safeApiRequestDoesNotRequireToken() {
        AtomicBoolean forwarded = new AtomicBoolean();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/functions").build()
        );

        filter.filter(exchange, current -> {
            forwarded.set(true);
            return current.getResponse().setComplete();
        }).block();

        assertThat(forwarded).isTrue();
    }
}
