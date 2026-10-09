package adliya.uz.functioncatalogservice.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import org.springframework.web.context.request.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.NoSuchElementException;

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
    public record Organization(Long id, String name, Boolean enabled) {}
    public record PublicOrganization(Long id, String name) {}
}
