package adliya.uz.functioncatalogservice.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import org.springframework.web.context.request.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import adliya.uz.functioncatalogservice.dto.StaffMember;
import org.springframework.security.access.AccessDeniedException;

@Component
public class IdentityOrganizationClient {
    private final RestClient client;
    public IdentityOrganizationClient(@Qualifier("identityRestClientBuilder") RestClient.Builder builder) {
        client = builder.baseUrl("http://identity-service").build();
    }
    public void requireExisting(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Assign an organization before submitting for review");
        }
        var attributes = RequestContextHolder.getRequestAttributes();
        String cookie = attributes instanceof ServletRequestAttributes servlet
                ? servlet.getRequest().getHeader(HttpHeaders.COOKIE) : null;
        try {
            Organization organization = client.get().uri("/api/organizations/{id}", id)
                    .headers(headers -> { if (cookie != null) headers.set(HttpHeaders.COOKIE, cookie); })
                    .retrieve().body(Organization.class);
            if (organization == null || !id.equals(organization.id()) || !Boolean.TRUE.equals(organization.enabled())) {
                throw new IllegalArgumentException("Organization does not exist or is deactivated: " + id);
            }
        } catch (HttpClientErrorException.NotFound exception) {
            throw new IllegalArgumentException("Organization not found: " + id);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify organization with identity-service; retry with a current session");
        }
    }
    public PublicOrganization requirePublic(Long id) {
        try {
            PublicOrganization organization = client.get().uri("/api/public/organizations/{id}", id)
                    .retrieve().body(PublicOrganization.class);
            if (organization == null || !id.equals(organization.id())) {
                throw new NoSuchElementException("Organization not found: " + id);
            }
            return organization;
        } catch (HttpClientErrorException.NotFound exception) {
            throw new NoSuchElementException("Organization not found: " + id);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Organization directory is temporarily unavailable");
        }
    }
    /**
     * Active users authorized for the organization, as identity-service reports them to the calling user. The caller's
     * own session is forwarded, so identity-service applies its own organization scoping to the request.
     */
    public List<StaffMember> activeMembers(Long organizationId) {
        if (organizationId == null) {
            throw new IllegalArgumentException("The card has no organization");
        }
        var attributes = RequestContextHolder.getRequestAttributes();
        String cookie = attributes instanceof ServletRequestAttributes servlet
                ? servlet.getRequest().getHeader(HttpHeaders.COOKIE) : null;
        try {
            StaffMember[] members = client.get().uri("/api/organizations/{id}/members", organizationId)
                    .headers(headers -> { if (cookie != null) headers.set(HttpHeaders.COOKIE, cookie); })
                    .retrieve().body(StaffMember[].class);
            return members == null ? List.of() : Arrays.stream(members).filter(member -> member.id() != null).toList();
        } catch (HttpClientErrorException.NotFound exception) {
            throw new NoSuchElementException("Organization not found: " + organizationId);
        } catch (HttpClientErrorException.Forbidden | HttpClientErrorException.Unauthorized exception) {
            throw new AccessDeniedException("You can only manage staff of your own organization(s)");
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not load organization staff from identity-service; retry with a current session");
        }
    }
    public record Organization(Long id, String name, Boolean enabled) {}
    public record PublicOrganization(Long id, String name) {}
}
