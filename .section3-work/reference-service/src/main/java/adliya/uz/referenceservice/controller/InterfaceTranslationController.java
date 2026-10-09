package adliya.uz.referenceservice.controller;

import adliya.uz.referenceservice.dto.UpdateInterfaceTranslationsRequest;
import adliya.uz.referenceservice.service.InterfaceTranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/interface-translations")
@RequiredArgsConstructor
public class InterfaceTranslationController {

    private final InterfaceTranslationService translationService;

    /** Public UI dictionary for the chosen interface language. */
    @GetMapping("/{languageCode}")
    public ResponseEntity<Map<String, String>> get(@PathVariable String languageCode) {
        return ResponseEntity.ok(translationService.getTranslations(languageCode));
    }

    /** Adds or changes only the keys sent in the request. SUPER_ADMIN only. */
    @PutMapping("/{languageCode}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, String>> update(
            @PathVariable String languageCode,
            @RequestBody UpdateInterfaceTranslationsRequest request
    ) {
        return ResponseEntity.ok(translationService.updateTranslations(languageCode, request.translations()));
    }

    @DeleteMapping("/{languageCode}/{key}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String languageCode, @PathVariable String key) {
        translationService.deleteTranslation(languageCode, key);
        return ResponseEntity.noContent().build();
    }
}
