package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.service.OrgFunctionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/translations")
@RequiredArgsConstructor
public class InternalTranslationController {

    private final OrgFunctionService orgFunctionService;

    @PostMapping("/languages/{languageCode}")
    public ResponseEntity<Void> translateExisting(@PathVariable String languageCode) {
        orgFunctionService.translateExistingForLanguage(languageCode);
        return ResponseEntity.accepted().build();
    }
}
