package adliya.uz.functioncatalogservice.config;

import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.context.annotation.*;

@Configuration
public class CatalogMigrationConfig {
    @Bean
    FlywayConfigurationCustomizer catalogMigrationBaseline() {
        // Existing deployments used Hibernate DDL; V1 must still run on these nonempty schemas.
        return configuration -> configuration.baselineOnMigrate(true).baselineVersion("0");
    }
}
