package adliya.uz.functioncatalogservice.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Set;

@Component
public class CatalogAccess {

    private static final String MANAGE_ANY_ORGANIZATION = "FUNCTIONS_MANAGE_ANY_ORGANIZATION";
    private static final String ORG_REPORTS_MANAGE = "ORG_REPORTS_MANAGE";
    private static final String REPORTS_VIEW = "REPORTS_VIEW";
    private static final String REPORTS_MANAGE = "REPORTS_MANAGE";

    public JwtPrincipal principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof JwtPrincipal principal)) {
            throw new AccessDeniedException("Authentication is required");
        }
        return principal;
    }

    public boolean global() {
        return isGlobal(principal());
    }

    public boolean authenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof JwtPrincipal;
    }

    public OrganizationScope scope(Long requestedOrganizationId) {
        JwtPrincipal principal = principal();
        if (isGlobal(principal)) {
            return requestedOrganizationId == null ? OrganizationScope.all() : OrganizationScope.of(Set.of(requestedOrganizationId));
        }
        Set<Long> allowed = new LinkedHashSet<>(principal.organizationIds());
        if (requestedOrganizationId == null) {
            return OrganizationScope.of(allowed);
        }
        if (!allowed.contains(requestedOrganizationId)) {
            throw new AccessDeniedException("You can only view data of your own organization(s)");
        }
        return OrganizationScope.of(Set.of(requestedOrganizationId));
    }

    public boolean canManageReports() {
        var permissions = principal().permissions();
        return permissions.contains(ORG_REPORTS_MANAGE)
                || (permissions.contains(REPORTS_VIEW) && permissions.contains(REPORTS_MANAGE));
    }

    public void requireReportManager() {
        if (!canManageReports()) {
            throw new AccessDeniedException("Required permission: " + ORG_REPORTS_MANAGE);
        }
    }

    public void requireOrganization(Long organizationId) {
        JwtPrincipal principal = principal();
        if (!isGlobal(principal) && (organizationId == null || !principal.organizationIds().contains(organizationId))) {
            throw new AccessDeniedException("You can only edit functions within your own organization(s)");
        }
    }

    public void requirePermission(String permission) {
        if (!principal().permissions().contains(permission)) {
            throw new AccessDeniedException("Required permission: " + permission);
        }
    }

    private static boolean isGlobal(JwtPrincipal principal) {
        return principal.isSuperAdmin() || principal.permissions().contains(MANAGE_ANY_ORGANIZATION);
    }
}
