package adliya.uz.functioncatalogservice.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CatalogAccess {
    public JwtPrincipal principal() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new AccessDeniedException("Authentication is required");
        }
        return principal;
    }

    public boolean global() {
        var principal = principal();
        return principal.isSuperAdmin() || principal.permissions().contains("FUNCTIONS_MANAGE_ANY_ORGANIZATION");
    }

    public void requireOrganization(Long organizationId) {
        if (!global() && (organizationId == null || !principal().organizationIds().contains(organizationId))) {
            throw new AccessDeniedException("You can only edit functions within your own organization(s)");
        }
    }

    public void requirePermission(String permission) {
        if (!principal().permissions().contains(permission)) {
            throw new AccessDeniedException("Required permission: " + permission);
        }
    }
}
