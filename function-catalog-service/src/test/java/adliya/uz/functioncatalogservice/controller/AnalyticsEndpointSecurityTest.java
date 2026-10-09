package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.config.ReportProperties;
import adliya.uz.functioncatalogservice.config.SecurityConfig;
import adliya.uz.functioncatalogservice.exception.RateLimitExceededException;
import adliya.uz.functioncatalogservice.security.JwtAuthenticationFilter;
import adliya.uz.functioncatalogservice.security.SimpleJwtService;
import adliya.uz.functioncatalogservice.service.ClientAddressResolver;
import adliya.uz.functioncatalogservice.service.EngagementInsightsService;
import adliya.uz.functioncatalogservice.service.EngagementTrackingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {EngagementController.class, OrganizationInsightsController.class},
        properties = {"eureka.client.enabled=false", "spring.cloud.discovery.enabled=false"})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, ReportProperties.class, ClientAddressResolver.class})
class AnalyticsEndpointSecurityTest {

    @Autowired MockMvc mvc;
    @MockitoBean EngagementTrackingService tracking;
    @MockitoBean EngagementInsightsService engagement;
    @MockitoBean SimpleJwtService jwt;

    @Test void anonymousVisitorsMayOnlyPostAggregateEvents() throws Exception {
        mvc.perform(post("/api/analytics/events").header("X-Real-IP", "203.0.113.7").contentType("application/json")
                .content("{\"type\":\"CATALOG_VIEW\"}")).andExpect(status().isAccepted());
        verify(tracking).record(any(), eq("203.0.113.7"));
        mvc.perform(get("/api/analytics/engagement")).andExpect(status().isForbidden());
        verifyNoInteractions(engagement);
    }

    @Test void engagementReadsRequireTheAnalyticsPermission() throws Exception {
        mvc.perform(get("/api/analytics/engagement").with(user("editor").authorities(new SimpleGrantedAuthority("FUNCTIONS_VIEW"))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/analytics/engagement").with(user("admin").roles("SUPER_ADMIN"))).andExpect(status().isForbidden());
        verifyNoInteractions(engagement);
        mvc.perform(get("/api/analytics/engagement").param("from", "2026-01-01").param("to", "2026-01-31")
                .with(user("analyst").authorities(new SimpleGrantedAuthority("ORG_ANALYTICS_VIEW")))).andExpect(status().isOk());
    }

    @Test void throttledEventsReturnRetryAfter() throws Exception {
        doThrow(new RateLimitExceededException(Duration.ofSeconds(90))).when(tracking).record(any(), any());
        mvc.perform(post("/api/analytics/events").contentType("application/json").content("{\"type\":\"CATALOG_VIEW\"}"))
                .andExpect(status().isTooManyRequests()).andExpect(header().string("Retry-After", "90"));
    }

    @Test void invalidDatesAreRejected() throws Exception {
        mvc.perform(get("/api/analytics/engagement").param("from", "yesterday")
                .with(user("analyst").authorities(new SimpleGrantedAuthority("ORG_ANALYTICS_VIEW")))).andExpect(status().isBadRequest());
    }
}
