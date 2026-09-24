package adliya.uz.functioncatalogservice;

import adliya.uz.functioncatalogservice.entity.*;
import adliya.uz.functioncatalogservice.repository.*;
import adliya.uz.functioncatalogservice.service.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "spring.config.import=", "jwt.secret=browser-isolated-test-secret-at-least-32-bytes",
        "eureka.client.enabled=false", "spring.cloud.discovery.enabled=false",
        "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.show-sql=false",
        "catalog.seed-legacy.enabled=false", "catalog.seed-editorial.enabled=false"
})
class AdminFunctionsBrowserIT {
    @Container static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    @LocalServerPort int port;
    @Autowired OrgFunctionRepository functions;
    @Autowired AuditLogRepository audit;
    @MockitoBean IdentityOrganizationClient organizations;
    @MockitoBean TranslationClient translator;
    @TempDir Path temporary;

    @Test void browserUsesRealControllerJwtTransactionsAndPostgres() throws Exception {
        var foreign = functions.saveAndFlush(OrgFunction.builder().name("Foreign draft").description("Other organization")
                .organizationId(20L).status(FunctionStatus.DRAFT).build());
        doAnswer(call -> {
            Long id = call.getArgument(0);
            if (id == null || (id != 10L && id != 20L)) throw new IllegalArgumentException("Unknown organization");
            return null;
        }).when(organizations).requireExisting(any());

        Path front = Path.of("..", "front").toAbsolutePath().normalize();
        boolean windows = System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("win");
        var process = new ProcessBuilder(windows ? List.of("cmd.exe", "/d", "/c", "npm.cmd", "run", "test:backend")
                : List.of("npm", "run", "test:backend"));
        process.directory(front.toFile());
        process.environment().put("CATALOG_TEST_URL", "http://127.0.0.1:" + port);
        process.environment().put("CATALOG_TEST_JWT", token(true));
        process.environment().put("CATALOG_SCOPED_JWT", token(false));
        process.environment().put("CATALOG_FOREIGN_ID", foreign.getId().toString());
        Path log = temporary.resolve("browser.log");
        process.redirectErrorStream(true).redirectOutput(log.toFile());
        Process running = process.start();
        try {
            boolean finished = running.waitFor(4, TimeUnit.MINUTES);
            assertThat(finished).withFailMessage("Browser test timed out: %s", Files.readString(log)).isTrue();
            assertThat(running.exitValue()).withFailMessage("Browser test failed: %s", Files.readString(log)).isZero();
            System.out.println(Files.readString(log));
        } finally {
            if (running.isAlive()) {
                running.descendants().forEach(ProcessHandle::destroyForcibly);
                running.destroyForcibly();
            }
        }
        var created = functions.findAll().stream().filter(f -> f.getName().equals("Browser service")).findFirst().orElseThrow();
        assertThat(created.getStatus()).isEqualTo(FunctionStatus.DEACTIVATED);
        assertThat(created.getNameTranslations().get("ru")).isEqualTo(new TranslatedText("Услуга браузера", "human"));
        assertThat(created.getNameTranslations().get("uz").text()).isEqualTo("Brauzer xizmati");
        assertThat(audit.findFunctionHistory(created.getId())).extracting(AuditLog::getAction)
                .contains(AuditAction.CREATE, AuditAction.TRANSLATION_EDIT, AuditAction.SUBMIT_REVIEW, AuditAction.PUBLISH, AuditAction.DEACTIVATE);
    }

    private String token(boolean global) {
        List<String> permissions = List.of("FUNCTIONS_VIEW", "FUNCTIONS_CREATE", "FUNCTIONS_EDIT", "FUNCTIONS_DEACTIVATE",
                "FUNCTIONS_SUBMIT_REVIEW", "FUNCTIONS_REVIEW", "FUNCTIONS_PUBLISH", "FUNCTIONS_REACTIVATE", "FUNCTIONS_TRANSLATIONS_EDIT", "AUDIT_VIEW");
        return Jwts.builder().subject("editor@example.test")
                .claim("userId",42L).claim("role",global ? "ROLE_SUPER_ADMIN" : "ROLE_ORG_ADMIN")
                .claim("organizationIds",List.of(10L)).claim("permissions",permissions).claim("mustChangePassword",false)
                .expiration(Date.from(Instant.now().plusSeconds(600)))
                .signWith(Keys.hmacShaKeyFor("browser-isolated-test-secret-at-least-32-bytes".getBytes(StandardCharsets.UTF_8))).compact();
    }
}
