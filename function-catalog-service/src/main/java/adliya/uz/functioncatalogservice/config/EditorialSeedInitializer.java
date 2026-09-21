package adliya.uz.functioncatalogservice.config;

import adliya.uz.functioncatalogservice.service.EditorialSeedService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import java.util.List;

@Component @Order(20) @RequiredArgsConstructor
@ConditionalOnProperty(name = "catalog.seed-editorial.enabled", havingValue = "true", matchIfMissing = true)
public class EditorialSeedInitializer implements CommandLineRunner {
    private final EditorialSeedService seeds;
    private final ObjectMapper mapper;
    @Override public void run(String... args) throws Exception {
        try (var stream = new ClassPathResource("seed/editorial-functions.json").getInputStream()) {
            List<EditorialSeedService.Seed> entries = mapper.readValue(stream, new TypeReference<>() {});
            for (var entry : entries) seeds.seed(entry);
        }
    }
}
