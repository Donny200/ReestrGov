package adliya.uz.referenceservice.controller;

import adliya.uz.referenceservice.service.InterfaceTranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint used only by identity-service after it enables a language. */
@RestController
@RequestMapping("/internal/interface-translations")
@RequiredArgsConstructor
public class InternalInterfaceTranslationController {

    private final InterfaceTranslationService translationService;

    @PostMapping("/languages/{languageCode}")
    public ResponseEntity<Void> translateForLanguage(@PathVariable String languageCode) {
        translationService.createTranslationsForLanguage(languageCode);
        return ResponseEntity.accepted().build();
    }
}
