package adliya.uz.functioncatalogservice.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;

final class PublicRoutePolicy {

    private PublicRoutePolicy() {
    }

    static boolean shouldBypassUserAuthentication(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI().substring(request.getContextPath().length());

        if (HttpMethod.OPTIONS.matches(method) || path.startsWith("/internal/")) {
            return true;
        }
        if (isSwagger(path)) {
            return true;
        }
        return HttpMethod.GET.matches(method) && isAtOrBelow(path, "/api/functions");
    }

    private static boolean isAtOrBelow(String path, String basePath) {
        return path.equals(basePath) || path.startsWith(basePath + "/");
    }

    private static boolean isSwagger(String path) {
        return path.equals("/swagger")
                || path.startsWith("/swagger/")
                || path.startsWith("/swagger-ui/")
                || path.equals("/v3/api-docs")
                || path.startsWith("/v3/api-docs/");
    }
}
