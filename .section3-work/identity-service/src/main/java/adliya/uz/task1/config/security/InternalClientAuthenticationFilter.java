package adliya.uz.task1.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class InternalClientAuthenticationFilter extends OncePerRequestFilter {

    public static final String INTROSPECTION_PATH = "/internal/auth/introspect";
    public static final String SERVICE_ID_HEADER = "X-Service-Id";
    public static final String INTROSPECTION_KEY_HEADER = "X-Introspection-Key";
    public static final String INTROSPECTION_AUTHORITY = "INTERNAL_TOKEN_INTROSPECT";

    private final InternalIntrospectionProperties properties;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String clientId = request.getHeader(SERVICE_ID_HEADER);
        String suppliedKey = request.getHeader(INTROSPECTION_KEY_HEADER);
        String expectedKey = properties.expectedKey(clientId);

        if (!constantTimeEquals(expectedKey, suppliedKey)) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":401,\"error\":\"Unauthorized\","
                            + "\"message\":\"Internal service authentication failed\"}"
            );
            return;
        }

        var authentication = new UsernamePasswordAuthenticationToken(
                clientId,
                null,
                List.of(new SimpleGrantedAuthority(INTROSPECTION_AUTHORITY))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !INTROSPECTION_PATH.equals(request.getServletPath());
    }

    private boolean constantTimeEquals(String expected, String supplied) {
        byte[] expectedDigest = sha256(expected == null ? "" : expected);
        byte[] suppliedDigest = sha256(supplied == null ? "" : supplied);
        boolean equal = MessageDigest.isEqual(expectedDigest, suppliedDigest);
        return expected != null && !expected.isBlank() && supplied != null && equal;
    }

    private byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
