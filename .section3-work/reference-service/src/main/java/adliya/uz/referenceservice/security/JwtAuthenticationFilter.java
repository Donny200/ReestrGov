package adliya.uz.referenceservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SimpleJwtService jwtService;
    private final IdentityTokenIntrospectionClient introspectionClient;
    private final TokenIntrospectionProperties introspectionProperties;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return PublicRoutePolicy.shouldBypassUserAuthentication(request);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        SecurityContextHolder.clearContext();
        String token = getTokenFromCookie(request);
        if (token == null || token.isBlank()) {
            writeError(response, HttpStatus.UNAUTHORIZED, "A valid access token is required");
            return;
        }

        try {
            AccessTokenMetadata metadata = jwtService.parseAccessToken(token);
            TokenIntrospectionResponse introspection = introspectionClient.introspect(token);
            if (!isUsable(introspection, metadata)) {
                writeError(response, HttpStatus.UNAUTHORIZED, "Access token is inactive");
                return;
            }

            JwtPrincipal principal = new JwtPrincipal(
                    introspection.userId(),
                    introspection.email(),
                    introspection.role(),
                    introspection.safePermissions(),
                    introspection.safeOrganizationIds(),
                    introspection.tokenVersion(),
                    introspection.jti()
            );

            Set<SimpleGrantedAuthority> authorities = new LinkedHashSet<>();
            authorities.add(new SimpleGrantedAuthority(introspection.role()));
            introspection.safePermissions().stream()
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);

            var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            filterChain.doFilter(request, response);
        } catch (IntrospectionUnavailableException exception) {
            SecurityContextHolder.clearContext();
            writeError(response, HttpStatus.SERVICE_UNAVAILABLE, "Authentication service is unavailable");
        } catch (Exception exception) {
            SecurityContextHolder.clearContext();
            writeError(response, HttpStatus.UNAUTHORIZED, "Access token is invalid");
        }
    }

    private boolean isUsable(TokenIntrospectionResponse response, AccessTokenMetadata metadata) {
        return response.active()
                && !response.mustChangePassword()
                && response.hasCanonicalIdentity()
                && response.userId() == metadata.userId()
                && response.tokenVersion() == metadata.tokenVersion()
                && response.jti().equals(metadata.jti())
                && response.email().equalsIgnoreCase(metadata.email());
    }

    private String getTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (introspectionProperties.getAccessTokenCookieName().equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"status\":" + status.value()
                        + ",\"error\":\"" + status.getReasonPhrase()
                        + "\",\"message\":\"" + message + "\"}"
        );
    }
}
