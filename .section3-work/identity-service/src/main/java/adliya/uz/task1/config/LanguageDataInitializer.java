package adliya.uz.task1.config;

import adliya.uz.task1.entity.Language;
import adliya.uz.task1.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class LanguageDataInitializer implements CommandLineRunner {

    private record Seed(String code) {
    }

    private final LanguageRepository languageRepository;

    @Override
    public void run(String... args) {
        List<Seed> defaults = List.of(
                new Seed("en"),
                new Seed("ru"),
                new Seed("uz")
        );

        for (Seed seed : defaults) {
            Language language = languageRepository.findByCode(seed.code())
                    .orElseGet(() -> {
                        Locale locale = Locale.forLanguageTag(seed.code());
                        return Language.builder()
                                .code(seed.code())
                                .nameNative(locale.getDisplayLanguage(locale))
                                .active(true)
                                .build();
                    });
            language.setActive(true);
            languageRepository.save(language);
        }

        if (languageRepository.findByIsDefaultTrueAndActiveTrue().isEmpty()) {
            languageRepository.findByCode("en").ifPresent(language -> {
                language.setDefault(true);
                languageRepository.save(language);
            });
        }
    }
}
