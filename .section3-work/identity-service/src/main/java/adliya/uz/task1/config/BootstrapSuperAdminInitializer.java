package adliya.uz.task1.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Profile("!dev & !test")
@Order(100)
@RequiredArgsConstructor
@Slf4j
public class BootstrapSuperAdminInitializer implements CommandLineRunner {

    static final String EMAIL_ENV = "BOOTSTRAP_SUPER_ADMIN_EMAIL";
    static final String PASSWORD_ENV = "BOOTSTRAP_SUPER_ADMIN_PASSWORD";

    private final SuperAdminProvisioner provisioner;
    private final Environment environment;

    @Override
    public void run(String... args) {
        if (provisioner.superAdminExists()) {
            return;
        }

        String email = requiredEnvironmentValue(EMAIL_ENV);
        String password = requiredEnvironmentValue(PASSWORD_ENV);

        provisioner.provisionIfMissing(email, password)
                .ifPresent(createdEmail -> log.warn(
                        "Initial SUPER_ADMIN account created for {}. A password change is required.",
                        createdEmail
                ));
    }

    private String requiredEnvironmentValue(String name) {
        String value = environment.getProperty(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "No SUPER_ADMIN exists. Set environment variable " + name + " before startup"
            );
        }
        return value;
    }
}
