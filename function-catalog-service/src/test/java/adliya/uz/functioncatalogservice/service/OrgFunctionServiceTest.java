package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import adliya.uz.functioncatalogservice.security.JwtPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrgFunctionServiceTest {

    @Mock
    private OrgFunctionRepository orgFunctionRepository;

    @Mock
    private OrgFunctionTranslationService translationService;

    @InjectMocks
    private OrgFunctionService service;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void publicQueriesUseOnlyActiveRepositoryMethods() {
        OrgFunction function = function(1L, 10L, true);
        when(orgFunctionRepository.findAllByActiveTrue()).thenReturn(List.of(function));
        when(orgFunctionRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(function));
        when(orgFunctionRepository.findAllByOrganizationIdAndActiveTrue(10L)).thenReturn(List.of(function));
        when(orgFunctionRepository.findAllByCategoryAndActiveTrue("Registry")).thenReturn(List.of(function));

        assertThat(service.getAll()).containsExactly(function);
        assertThat(service.getById(1L)).isSameAs(function);
        assertThat(service.getByOrganizationId(10L)).containsExactly(function);
        assertThat(service.getByCategory("Registry")).containsExactly(function);

        verify(orgFunctionRepository).findAllByActiveTrue();
        verify(orgFunctionRepository).findByIdAndActiveTrue(1L);
        verify(orgFunctionRepository).findAllByOrganizationIdAndActiveTrue(10L);
        verify(orgFunctionRepository).findAllByCategoryAndActiveTrue("Registry");
    }

    @Test
    void adminListIncludesInactiveFunctions() {
        OrgFunction active = function(1L, 10L, true);
        OrgFunction inactive = function(2L, 10L, false);
        when(orgFunctionRepository.findAll()).thenReturn(List.of(active, inactive));

        assertThat(service.getAllForAdmin()).containsExactly(active, inactive);

        verify(orgFunctionRepository).findAll();
    }

    @Test
    void userCanDeactivateFunctionFromOwnOrganization() {
        authenticate("ROLE_CUSTOM", List.of(10L), List.of("FUNCTIONS_DEACTIVATE"));
        OrgFunction function = function(1L, 10L, true);
        when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function));

        service.deactivate(1L);

        assertThat(function.getActive()).isFalse();
        verify(orgFunctionRepository).save(function);
    }

    @Test
    void userCannotDeactivateFunctionFromAnotherOrganization() {
        authenticate("ROLE_CUSTOM", List.of(10L), List.of("FUNCTIONS_DEACTIVATE"));
        OrgFunction function = function(1L, 20L, true);
        when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function));

        assertThatThrownBy(() -> service.deactivate(1L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("own organization");

        assertThat(function.getActive()).isTrue();
        verify(orgFunctionRepository, never()).save(function);
    }

    @Test
    void globalOrganizationPermissionCanDeactivateFunctionFromAnotherOrganization() {
        authenticate(
                "ROLE_CUSTOM",
                List.of(10L),
                List.of("FUNCTIONS_DEACTIVATE", "FUNCTIONS_MANAGE_ANY_ORGANIZATION")
        );
        OrgFunction function = function(1L, 20L, true);
        when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function));

        service.deactivate(1L);

        assertThat(function.getActive()).isFalse();
        verify(orgFunctionRepository).save(function);
    }

    @Test
    void missingJwtPrincipalFailsClosed() {
        OrgFunction function = function(1L, 10L, true);
        when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function));

        assertThatThrownBy(() -> service.deactivate(1L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Authentication is required");

        verify(orgFunctionRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    private void authenticate(String role, List<Long> organizationIds, List<String> permissions) {
        JwtPrincipal principal = new JwtPrincipal("user@example.com", role, organizationIds, permissions);
        var authorities = permissions.stream().map(SimpleGrantedAuthority::new).toList();
        var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private OrgFunction function(Long id, Long organizationId, boolean active) {
        return OrgFunction.builder()
                .id(id)
                .name("Function " + id)
                .organizationId(organizationId)
                .category("Registry")
                .active(active)
                .build();
    }
}
