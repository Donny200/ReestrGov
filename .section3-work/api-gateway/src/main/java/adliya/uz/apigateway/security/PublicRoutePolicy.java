package adliya.uz.apigateway.security;

import org.springframework.http.HttpMethod;

public final class PublicRoutePolicy {

    public AuthorizationRequirement requirement(HttpMethod method, String path) {
        if (HttpMethod.OPTIONS.equals(method)) {
            return AuthorizationRequirement.PUBLIC;
        }

        if (isPublicAuthRoute(method, path)
                || isPublicReadRoute(method, path)
                || isSwagger(path)) {
            return AuthorizationRequirement.PUBLIC;
        }

        if ((HttpMethod.GET.equals(method) && path.equals("/api/auth/me"))
                || (HttpMethod.POST.equals(method)
                && (path.equals("/api/auth/change-password") || path.equals("/api/auth/logout-all")))) {
            return AuthorizationRequirement.ACTIVE_ALLOW_PASSWORD_CHANGE;
        }

        return AuthorizationRequirement.ACTIVE_PASSWORD_CHANGED;
    }

    private boolean isPublicAuthRoute(HttpMethod method, String path) {
        if (HttpMethod.GET.equals(method) && path.equals("/api/auth/csrf")) {
            return true;
        }
        return HttpMethod.POST.equals(method)
                && (path.equals("/api/auth/login")
                || path.equals("/api/auth/refresh")
                || path.equals("/api/auth/logout"));
    }

    private boolean isPublicReadRoute(HttpMethod method, String path) {
        if (!HttpMethod.GET.equals(method)) {
            return false;
        }
        return isAtOrBelow(path, "/api/public")
                || path.equals("/api/languages")
                || path.equals("/api/languages/catalog")
                || isAtOrBelow(path, "/api/regions")
                || isAtOrBelow(path, "/api/interface-translations")
                || isAtOrBelow(path, "/api/functions");
    }

    private boolean isAtOrBelow(String path, String basePath) {
        return path.equals(basePath) || path.startsWith(basePath + "/");
    }

    private boolean isSwagger(String path) {
        return path.equals("/swagger")
                || path.startsWith("/swagger/")
                || path.startsWith("/swagger-ui/")
                || path.equals("/v3/api-docs")
                || path.startsWith("/v3/api-docs/");
    }

    public enum AuthorizationRequirement {
        PUBLIC,
        ACTIVE_ALLOW_PASSWORD_CHANGE,
        ACTIVE_PASSWORD_CHANGED
    }
}
