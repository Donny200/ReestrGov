package adliya.uz.apigateway.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

import static adliya.uz.apigateway.security.PublicRoutePolicy.AuthorizationRequirement.ACTIVE_ALLOW_PASSWORD_CHANGE;
import static adliya.uz.apigateway.security.PublicRoutePolicy.AuthorizationRequirement.ACTIVE_PASSWORD_CHANGED;
import static adliya.uz.apigateway.security.PublicRoutePolicy.AuthorizationRequirement.PUBLIC;
import static org.assertj.core.api.Assertions.assertThat;

class PublicRoutePolicyTest {

    private final PublicRoutePolicy policy = new PublicRoutePolicy();

    @Test
    void bypassesOnlyExactPublicMethodAndPathCombinations() {
        assertThat(policy.requirement(HttpMethod.OPTIONS, "/api/organizations")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.POST, "/api/auth/login")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.POST, "/api/auth/refresh")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.POST, "/api/auth/logout")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.GET, "/api/auth/csrf")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.GET, "/api/public/organizations/1")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.GET, "/api/languages")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.GET, "/api/languages/catalog")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.GET, "/api/regions/1")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.GET, "/api/interface-translations/uz")).isEqualTo(PUBLIC);
        assertThat(policy.requirement(HttpMethod.GET, "/api/functions/1")).isEqualTo(PUBLIC);
    }

    @Test
    void samePathsWithMutatingMethodsRemainProtected() {
        assertThat(policy.requirement(HttpMethod.POST, "/api/functions")).isEqualTo(ACTIVE_PASSWORD_CHANGED);
        assertThat(policy.requirement(HttpMethod.PUT, "/api/interface-translations/uz"))
                .isEqualTo(ACTIVE_PASSWORD_CHANGED);
        assertThat(policy.requirement(HttpMethod.POST, "/api/languages"))
                .isEqualTo(ACTIVE_PASSWORD_CHANGED);
        assertThat(policy.requirement(HttpMethod.GET, "/api/languages/search"))
                .isEqualTo(ACTIVE_PASSWORD_CHANGED);
        assertThat(policy.requirement(HttpMethod.GET, "/api/functions-malicious"))
                .isEqualTo(ACTIVE_PASSWORD_CHANGED);
    }

    @Test
    void mandatoryPasswordChangeRoutesRequireActiveTokenButAllowFlag() {
        assertThat(policy.requirement(HttpMethod.GET, "/api/auth/me"))
                .isEqualTo(ACTIVE_ALLOW_PASSWORD_CHANGE);
        assertThat(policy.requirement(HttpMethod.POST, "/api/auth/change-password"))
                .isEqualTo(ACTIVE_ALLOW_PASSWORD_CHANGE);
        assertThat(policy.requirement(HttpMethod.POST, "/api/auth/logout-all"))
                .isEqualTo(ACTIVE_ALLOW_PASSWORD_CHANGE);
        assertThat(policy.requirement(HttpMethod.GET, "/api/auth/change-password"))
                .isEqualTo(ACTIVE_PASSWORD_CHANGED);
    }
}
