package adliya.uz.functioncatalogservice;

import adliya.uz.functioncatalogservice.dto.CreateOrgFunctionRequest;
import adliya.uz.functioncatalogservice.dto.StaffMember;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.service.HelpNotificationMailer;
import adliya.uz.functioncatalogservice.service.IdentityOrganizationClient;
import adliya.uz.functioncatalogservice.service.OrgFunctionService;
import adliya.uz.functioncatalogservice.service.TranslationClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static adliya.uz.functioncatalogservice.support.TestPrincipals.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Anonymous questions with private follow-up links, and the organization-scoped staff inbox. */
@Testcontainers
@SpringBootTest(properties = {
        "spring.config.import=", "jwt.secret=help-test-secret-at-least-32-bytes-long",
        "eureka.client.enabled=false", "spring.cloud.discovery.enabled=false",
        "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.show-sql=false",
        "catalog.seed-legacy.enabled=false", "catalog.seed-editorial.enabled=false", "catalog.scheduling.enabled=false",
        "catalog.help.per-client-limit=4", "catalog.help.max-unanswered-visitor-messages=2"
})
@AutoConfigureMockMvc
class HelpConversationPostgresTest {
    @Container static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    private static final String TOKEN = "X-Conversation-Token";
    private static final AtomicInteger CLIENTS = new AtomicInteger(1);
    private static final List<String> INBOX = List.of("VISITOR_QUESTIONS_VIEW", "VISITOR_QUESTIONS_REPLY");
    private static final UsernamePasswordAuthenticationToken STAFF_10 = staff(10, List.of(10L), INBOX.toArray(String[]::new));
    private static final UsernamePasswordAuthenticationToken STAFF_20 = staff(20, List.of(20L), INBOX.toArray(String[]::new));
    private static final UsernamePasswordAuthenticationToken VIEWER_10 = staff(11, List.of(10L), "VISITOR_QUESTIONS_VIEW");
    private static final UsernamePasswordAuthenticationToken ADMIN = superAdmin(INBOX.toArray(String[]::new));

    @Autowired OrgFunctionService functions;
    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean IdentityOrganizationClient organizations;
    @MockitoBean TranslationClient translator;
    @MockitoBean HelpNotificationMailer mailer;

    private OrgFunction service10;
    private OrgFunction service20;

    @BeforeEach void setup() {
        jdbc.execute("TRUNCATE help_messages, help_conversations, information_reports, audit_log_functions, audit_logs, "
                + "function_public_changes, translation_jobs, org_functions, function_categories RESTART IDENTITY CASCADE");
        doAnswer(call -> null).when(organizations).requireExisting(any());
        when(mailer.available()).thenReturn(false);
        service10 = published("Passport registration", 10L);
        service20 = published("Tax certificate", 20L);
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void visitorAsksWithoutAccountAndFollowsUpOnlyWithTheSecretToken() throws Exception {
        JsonNode started = start(service10.getId(), "Which documents do I need for a child?");
        String token = started.get("accessToken").asText();
        assertThat(token).matches("[A-Za-z0-9_-]{43}");
        assertThat(started.at("/conversation/status").asText()).isEqualTo("NEW");
        assertThat(started.at("/conversation/serviceName").asText()).isEqualTo("Passport registration");
        assertThat(started.at("/conversation/organizationId").asLong()).isEqualTo(10L);
        assertThat(started.at("/conversation/notificationRequested").asBoolean()).isFalse();
        assertThat(started.at("/conversation/messages/0/author").asText()).isEqualTo("VISITOR");
        assertThat(started.at("/conversation").has("id")).isFalse();

        // Only the hash is stored, and the token does not appear in any column.
        String stored = jdbc.queryForObject("SELECT access_token_hash FROM help_conversations", String.class);
        assertThat(stored).hasSize(64).isNotEqualTo(token);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM help_conversations WHERE access_token_hash LIKE ?", Long.class, "%" + token + "%")).isZero();

        mvc.perform(get("/api/help/conversation").with(anonymous()).header(TOKEN, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages[0].body").value("Which documents do I need for a child?"))
                .andExpect(jsonPath("$.canWrite").value(true));
        // No token, a malformed one, a different valid-looking one, or the numeric id: nothing is found.
        mvc.perform(get("/api/help/conversation").with(anonymous())).andExpect(status().isNotFound());
        mvc.perform(get("/api/help/conversation").with(anonymous()).header(TOKEN, "1")).andExpect(status().isNotFound());
        mvc.perform(get("/api/help/conversation").with(anonymous()).header(TOKEN, "A".repeat(43))).andExpect(status().isNotFound());
        mvc.perform(get("/api/help/conversation").with(anonymous()).param("id", "1")).andExpect(status().isNotFound());
        mvc.perform(get("/api/help/inbox/1").with(anonymous())).andExpect(status().isForbidden());
        mvc.perform(get("/api/help/inbox").with(anonymous())).andExpect(status().isForbidden());

        visitor(post("/api/help/conversation/messages").header(TOKEN, token))
                .content("{\"message\":\"Also: can I apply on a weekend?\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages.length()").value(2));
        // Two unanswered visitor messages in a row is the configured maximum.
        visitor(post("/api/help/conversation/messages").header(TOKEN, token))
                .content("{\"message\":\"Hello? Anyone reading this?\"}")
                .andExpect(status().isConflict());
        mvc.perform(get("/api/help/conversation").with(anonymous()).header(TOKEN, token)).andExpect(jsonPath("$.canWrite").value(false));
    }

    @Test void serviceQuestionsReachOnlyTheirOrganizationAndGeneralOnesOnlySuperAdmin() throws Exception {
        start(service10.getId(), "Question about the passport service");
        start(service20.getId(), "Question about the tax certificate");
        start(null, "General question about this website");
        Long passport = id("Question about the passport service");
        Long tax = id("Question about the tax certificate");
        Long general = id("General question about this website");

        mvc.perform(get("/api/help/inbox").with(authentication(STAFF_10)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(passport))
                .andExpect(jsonPath("$[0].status").value("NEW"));
        mvc.perform(get("/api/help/inbox").with(authentication(STAFF_20)))
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(tax));
        mvc.perform(get("/api/help/inbox/" + tax).with(authentication(STAFF_10))).andExpect(status().isForbidden());
        mvc.perform(get("/api/help/inbox/" + general).with(authentication(STAFF_10))).andExpect(status().isForbidden());
        mvc.perform(get("/api/help/inbox").param("organizationId", "20").with(authentication(STAFF_10))).andExpect(status().isForbidden());
        mvc.perform(get("/api/help/inbox").param("general", "true").with(authentication(STAFF_10))).andExpect(status().isForbidden());
        mvc.perform(post("/api/help/inbox/" + tax + "/replies").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"message\":\"Not my organization\"}")).andExpect(status().isForbidden());

        mvc.perform(get("/api/help/inbox").with(authentication(ADMIN))).andExpect(jsonPath("$.length()").value(3));
        mvc.perform(get("/api/help/inbox").param("general", "true").with(authentication(ADMIN)))
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].general").value(true));
        mvc.perform(get("/api/help/inbox/" + general).with(authentication(ADMIN)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.messages[0].body").value("General question about this website"));
        // Without the inbox permission nothing is visible even inside the organization.
        mvc.perform(get("/api/help/inbox").with(authentication(staff(12, List.of(10L), "REPORTS_VIEW")))).andExpect(status().isForbidden());
    }

    @Test void staffReplyReachesTheVisitorWithoutStaffIdentityAndStatusesFollowTheConversation() throws Exception {
        String token = start(service10.getId(), "Is the service free of charge?").get("accessToken").asText();
        Long id = id("Is the service free of charge?");

        mvc.perform(post("/api/help/inbox/" + id + "/replies").with(authentication(VIEWER_10)).contentType("application/json")
                .content("{\"message\":\"Yes\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/help/inbox/" + id + "/replies").with(authentication(STAFF_10)).contentType("application/json")
                        .content("{\"message\":\"Yes, it is free. See the fee section on the service page.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversation.status").value("ANSWERED"))
                .andExpect(jsonPath("$.conversation.assignedUserId").value(10))
                .andExpect(jsonPath("$.messages[1].staffLabel").value("staff10@example.test"));

        String visitorView = mvc.perform(get("/api/help/conversation").with(anonymous()).header(TOKEN, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ANSWERED"))
                .andExpect(jsonPath("$.messages[1].author").value("STAFF"))
                .andExpect(jsonPath("$.messages[1].body").value("Yes, it is free. See the fee section on the service page."))
                .andReturn().getResponse().getContentAsString();
        assertThat(visitorView).doesNotContain("staff10@example.test", "staffUserId", "assignedUser");

        visitor(post("/api/help/conversation/messages").header(TOKEN, token)).content("{\"message\":\"Thank you, one more thing...\"}")
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mvc.perform(put("/api/help/inbox/" + id + "/status").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"status\":\"ANSWERED\"}")).andExpect(status().isConflict());
        mvc.perform(put("/api/help/inbox/" + id + "/status").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"status\":\"CLOSED\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.conversation.status").value("CLOSED"));
        mvc.perform(get("/api/help/conversation").with(anonymous()).header(TOKEN, token)).andExpect(jsonPath("$.canWrite").value(false));
        visitor(post("/api/help/conversation/messages").header(TOKEN, token)).content("{\"message\":\"Another question here\"}")
                .andExpect(status().isConflict());
        mvc.perform(post("/api/help/inbox/" + id + "/replies").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"message\":\"Late reply\"}")).andExpect(status().isConflict());

        assertThat(jdbc.queryForList("SELECT action FROM audit_logs WHERE entity_type = 'HELP_CONVERSATION' ORDER BY id", String.class))
                .containsExactly("HELP_REPLY", "HELP_STATUS_CHANGE");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE details LIKE '%free%'", Long.class)).isZero();
    }

    @Test void assignmentIsLimitedToActiveMembersOfTheResponsibleOrganization() throws Exception {
        start(service10.getId(), "Who handles my question please?");
        Long id = id("Who handles my question please?");
        when(organizations.activeMembers(10L)).thenReturn(List.of(new StaffMember(7L, "Ann", "Lee", "ann@example.test", "ROLE_MODERATOR")));
        mvc.perform(put("/api/help/inbox/" + id + "/assignee").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"userId\":99}")).andExpect(status().isBadRequest());
        mvc.perform(put("/api/help/inbox/" + id + "/assignee").with(authentication(STAFF_10)).contentType("application/json")
                        .content("{\"userId\":7}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversation.assignedUserName").value("Ann Lee"));
        mvc.perform(get("/api/help/inbox").param("assignee", "me").with(authentication(STAFF_10))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(put("/api/help/inbox/" + id + "/assignee").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"userId\":null}")).andExpect(status().isOk()).andExpect(jsonPath("$.conversation.assignedUserId").doesNotExist());
    }

    @Test void inputIsValidatedAndSensitiveNumbersAndUnpublishedServicesAreRefused() throws Exception {
        visitor(post("/api/help/conversations")).content("{\"message\":\"short\"}").andExpect(status().isBadRequest());
        visitor(post("/api/help/conversations")).content("{\"message\":\"" + "x".repeat(2001) + "\"}").andExpect(status().isBadRequest());
        visitor(post("/api/help/conversations")).content("{\"message\":\"My PINFL is 3121 0890 1234 56, what now?\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.message").exists());
        visitor(post("/api/help/conversations")).content("{\"message\":\"Question about a draft service\",\"serviceId\":999999}")
                .andExpect(status().isNotFound());
        visitor(post("/api/help/conversations")).content("{\"message\":\"Valid question text\",\"email\":\"not-an-email\"}")
                .andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM help_conversations", Long.class)).isZero();

        // Honeypot: looks accepted, nothing is stored.
        visitor(post("/api/help/conversations")).content("{\"message\":\"Spam spam spam spam\",\"website\":\"http://spam.example\"}")
                .andExpect(status().isCreated()).andExpect(jsonPath("$.accessToken").exists());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM help_conversations", Long.class)).isZero();
    }

    @Test void visitorsAreRateLimitedPerAddress() throws Exception {
        String address = "203.0.113.250";
        for (int index = 0; index < 4; index++) {
            mvc.perform(post("/api/help/conversations").with(anonymous()).header("X-Real-IP", address).contentType("application/json")
                    .content("{\"message\":\"Rate limited question " + index + "\"}")).andExpect(status().isCreated());
        }
        mvc.perform(post("/api/help/conversations").with(anonymous()).header("X-Real-IP", address).contentType("application/json")
                        .content("{\"message\":\"One question too many\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test void contactAddressIsOptionalUsedOnlyWhenNotificationsAreConfiguredAndNeverShownToStaff() throws Exception {
        JsonNode withoutMail = start(service10.getId(), "Question without notifications", "visitor@example.test");
        assertThat(withoutMail.get("notificationsAvailable").asBoolean()).isFalse();
        assertThat(withoutMail.at("/conversation/notificationRequested").asBoolean()).isFalse();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM help_conversations WHERE notify_email IS NOT NULL", Long.class)).isZero();
        mvc.perform(get("/api/help/options").with(anonymous())).andExpect(jsonPath("$.notificationsAvailable").value(false));
        verify(mailer, never()).sendConfirmation(anyString(), anyString());

        when(mailer.available()).thenReturn(true);
        JsonNode withMail = start(service10.getId(), "Question with notifications", "visitor@example.test");
        String token = withMail.get("accessToken").asText();
        assertThat(withMail.at("/conversation/notificationRequested").asBoolean()).isTrue();
        verify(mailer).sendConfirmation("visitor@example.test", token);
        Long id = id("Question with notifications");

        String staffView = mvc.perform(get("/api/help/inbox/" + id).with(authentication(STAFF_10)))
                .andExpect(jsonPath("$.conversation.notificationRequested").value(true))
                .andReturn().getResponse().getContentAsString();
        String inbox = mvc.perform(get("/api/help/inbox").with(authentication(STAFF_10))).andReturn().getResponse().getContentAsString();
        assertThat(staffView + inbox).doesNotContain("visitor@example.test");

        mvc.perform(post("/api/help/inbox/" + id + "/replies").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"message\":\"Here is your answer.\"}")).andExpect(status().isOk());
        verify(mailer).sendReplyNotice("visitor@example.test");
        mvc.perform(put("/api/help/inbox/" + id + "/status").with(authentication(STAFF_10)).contentType("application/json")
                .content("{\"status\":\"CLOSED\"}")).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT notify_email FROM help_conversations WHERE id = ?", String.class, id)).isNull();
        verify(mailer, times(1)).sendReplyNotice(eq("visitor@example.test"));
    }

    private JsonNode start(Long serviceId, String message) throws Exception {
        return start(serviceId, message, null);
    }

    private JsonNode start(Long serviceId, String message, String email) throws Exception {
        String body = json.writeValueAsString(new java.util.LinkedHashMap<String, Object>() {{
            if (serviceId != null) put("serviceId", serviceId);
            put("message", message);
            if (email != null) put("email", email);
            put("language", "en");
        }});
        return json.readTree(visitor(post("/api/help/conversations")).content(body)
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private Long id(String firstMessage) {
        return jdbc.queryForObject("SELECT conversation_id FROM help_messages WHERE body = ? AND author = 'VISITOR'", Long.class, firstMessage);
    }

    /** Each call comes from its own visitor address so that the per-client limit only applies where a test wants it. */
    private Visitor visitor(MockHttpServletRequestBuilder request) {
        return new Visitor(request.with(anonymous()).header("X-Real-IP", "198.51.100." + CLIENTS.incrementAndGet() % 250)
                .contentType("application/json"));
    }

    private final class Visitor {
        private final MockHttpServletRequestBuilder request;
        Visitor(MockHttpServletRequestBuilder request) { this.request = request; }
        org.springframework.test.web.servlet.ResultActions content(String body) throws Exception {
            return mvc.perform(request.content(body));
        }
    }

    private OrgFunction published(String name, Long organization) {
        login(superAdmin(with(EDITOR)));
        var card = functions.create(new CreateOrgFunctionRequest(name, "Description", organization, "Docs", null));
        functions.submitForReview(card.getId());
        OrgFunction result = functions.publish(card.getId());
        SecurityContextHolder.clearContext();
        return result;
    }
}
