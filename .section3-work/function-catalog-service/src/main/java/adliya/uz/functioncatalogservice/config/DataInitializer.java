package adliya.uz.functioncatalogservice.config;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final OrgFunctionRepository orgFunctionRepository;

    public DataInitializer(OrgFunctionRepository orgFunctionRepository) {
        this.orgFunctionRepository = orgFunctionRepository;
    }

    @Override
    public void run(String... args) {
        if (orgFunctionRepository.count() == 0) {
            orgFunctionRepository.save(OrgFunction.builder()
                    .name("Passport renewal")
                    .description("Renew an expired or damaged passport")
                    .category("Civil Registration")
                    .organizationId(1L)
                    .requirements("Old passport, 1 photo, application fee")
                    .build());

            orgFunctionRepository.save(OrgFunction.builder()
                    .name("Marriage registration")
                    .description("Register a marriage")
                    .category("Civil Registration")
                    .organizationId(1L)
                    .requirements("Both parties' IDs, witnesses")
                    .build());

            orgFunctionRepository.save(OrgFunction.builder()
                    .name("Business license application")
                    .description("Apply for a new business operating license")
                    .category("Business Services")
                    .organizationId(1L)
                    .requirements("Business plan, tax ID, application fee")
                    .build());
        }
    }
}