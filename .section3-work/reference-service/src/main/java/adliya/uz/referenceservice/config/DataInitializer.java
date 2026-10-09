package adliya.uz.referenceservice.config;

import adliya.uz.referenceservice.entity.Region;
import adliya.uz.referenceservice.repository.RegionRepository;
import adliya.uz.referenceservice.service.InterfaceTranslationService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private record RegionSeed(String name, String code) {
    }

    private final RegionRepository regionRepository;
    private final InterfaceTranslationService translationService;

    public DataInitializer(
            RegionRepository regionRepository,
            InterfaceTranslationService translationService
    ) {
        this.regionRepository = regionRepository;
        this.translationService = translationService;
    }

    @Override
    public void run(String... args) {
        seedRegions();
        translationService.seedSourceTranslations();
    }

    private void seedRegions() {
        List<RegionSeed> seeds = List.of(
                new RegionSeed("Tashkent", "1700"),
                new RegionSeed("Samarkand", "1706"),
                new RegionSeed("Khorezm", "1710"),
                new RegionSeed("Bukhara", "1703"),
                new RegionSeed("Fergana", "1707")
        );

        for (RegionSeed seed : seeds) {
            if (!regionRepository.existsByCode(seed.code())) {
                regionRepository.save(Region.builder()
                        .name(seed.name())
                        .code(seed.code())
                        .build());
            }
        }
    }
}
