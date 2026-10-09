package adliya.uz.task1.controller;

import adliya.uz.task1.config.security.InternalClientAuthenticationFilter;
import adliya.uz.task1.dto.TokenIntrospectionRequest;
import adliya.uz.task1.dto.TokenIntrospectionResponse;
import adliya.uz.task1.service.TokenIntrospectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class InternalTokenIntrospectionController {

    private final TokenIntrospectionService tokenIntrospectionService;

    @PostMapping(InternalClientAuthenticationFilter.INTROSPECTION_PATH)
    @PreAuthorize("hasAuthority('" + InternalClientAuthenticationFilter.INTROSPECTION_AUTHORITY + "')")
    public ResponseEntity<TokenIntrospectionResponse> introspect(
            @Valid @RequestBody TokenIntrospectionRequest request
    ) {
        return ResponseEntity.ok(tokenIntrospectionService.introspect(request.token()));
    }
}
