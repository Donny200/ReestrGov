package adliya.uz.functioncatalogservice.config;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.entity.FunctionStatus;
import adliya.uz.functioncatalogservice.entity.FunctionCategory;
import adliya.uz.functioncatalogservice.repository.FunctionCategoryRepository;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "catalog.seed-legacy.enabled", havingValue = "true", matchIfMissing = true)
@org.springframework.core.annotation.Order(0)
public class DataInitializer implements CommandLineRunner {

    private final OrgFunctionRepository orgFunctionRepository;
    private final FunctionCategoryRepository categories;

    public DataInitializer(OrgFunctionRepository orgFunctionRepository, FunctionCategoryRepository categories) {
        this.orgFunctionRepository = orgFunctionRepository;
        this.categories = categories;
    }

    @Override
    public void run(String... args) {
        if (orgFunctionRepository.count() == 0) {
            orgFunctionRepository.save(OrgFunction.builder()
                    .name("Passport renewal")
                    .description("Renew an expired or damaged passport")
                    .functionCategory(category("Civil Registration"))
                    .status(FunctionStatus.PUBLISHED)
                    .organizationId(1L)
                    .requirements("Old passport, 1 photo, application fee")
                    .build());

            orgFunctionRepository.save(OrgFunction.builder()
                    .name("Marriage registration")
                    .description("Register a marriage")
                    .functionCategory(category("Civil Registration"))
                    .status(FunctionStatus.PUBLISHED)
                    .organizationId(1L)
                    .requirements("Both parties' IDs, witnesses")
                    .build());

            orgFunctionRepository.save(OrgFunction.builder()
                    .name("Business license application")
                    .description("Apply for a new business operating license")
                    .functionCategory(category("Business Services"))
                    .status(FunctionStatus.PUBLISHED)
                    .organizationId(1L)
                    .requirements("Business plan, tax ID, application fee")
                    .build());
        }
    }
    private FunctionCategory category(String name) {
        return categories.findByName(name).orElseGet(() -> categories.save(FunctionCategory.builder().name(name).build()));
    }
}