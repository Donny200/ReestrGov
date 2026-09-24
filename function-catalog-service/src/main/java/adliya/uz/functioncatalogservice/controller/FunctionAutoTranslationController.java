package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.dto.*;
import adliya.uz.functioncatalogservice.service.FunctionAutoTranslationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/functions")
@RequiredArgsConstructor
public class FunctionAutoTranslationController {
    private final FunctionAutoTranslationService service;

    @GetMapping("/translation-capabilities")
    @PreAuthorize("hasAuthority('FUNCTIONS_EDIT') and hasAuthority('FUNCTIONS_TRANSLATIONS_EDIT')")
    public Capabilities capabilities() { return new Capabilities(service.available()); }

    @PostMapping("/{id}/translate")
    @PreAuthorize("hasAuthority('FUNCTIONS_EDIT') and hasAuthority('FUNCTIONS_TRANSLATIONS_EDIT')")
    public OrgFunctionResponse translate(@PathVariable Long id, @Valid @RequestBody AutoTranslateRequest request) {
        return OrgFunctionResponse.from(service.translate(id, request));
    }
    public record Capabilities(boolean available) {}
}
