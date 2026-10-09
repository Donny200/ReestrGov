package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.*;
import adliya.uz.functioncatalogservice.entity.*;
import adliya.uz.functioncatalogservice.repository.*;
import adliya.uz.functioncatalogservice.security.*;
import adliya.uz.functioncatalogservice.exception.WorkflowConflictException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.*;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static adliya.uz.functioncatalogservice.entity.FunctionStatus.*;

@ExtendWith(MockitoExtension.class)
class OrgFunctionServiceTest {
    @Mock OrgFunctionRepository orgFunctionRepository;
    @Mock OrgFunctionTranslationService translationService;
    @Mock FunctionCategoryService categories;
    @Spy CatalogAccess access = new CatalogAccess();
    @Mock AuditWriter audit;
    @Mock AuditLogRepository auditLogs;
    @Mock IdentityOrganizationClient organizations;
    @Mock ReportReviewService reports;
    @InjectMocks OrgFunctionService service;
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void publicQueriesStrictlyUsePublished() {
        service.getAll(); service.getByOrganizationId(10L); service.getByCategory("Registry");
        assertThatThrownBy(() -> service.getById(1L)).isInstanceOf(NoSuchElementException.class);
        verify(orgFunctionRepository).findAllByStatus(PUBLISHED);
        verify(orgFunctionRepository).findAllByOrganizationIdAndStatus(10L, PUBLISHED);
        verify(orgFunctionRepository).findAllByFunctionCategory_NameAndStatus("Registry", PUBLISHED);
        verify(orgFunctionRepository).findByIdAndStatus(1L, PUBLISHED);
        verify(orgFunctionRepository, never()).findAll();
    }

    static Stream<Arguments> transitions() {
        return Stream.of(
                new Object[]{"submit", DRAFT, PENDING_REVIEW, AuditAction.SUBMIT_REVIEW},
                new Object[]{"reject", PENDING_REVIEW, DRAFT, AuditAction.REJECT},
                new Object[]{"publish", PENDING_REVIEW, PUBLISHED, AuditAction.PUBLISH},
                new Object[]{"reactivate", DEACTIVATED, PENDING_REVIEW, AuditAction.REACTIVATE},
                new Object[]{"deactivate", PUBLISHED, DEACTIVATED, AuditAction.DEACTIVATE}
        ).flatMap(t -> Arrays.stream(FunctionStatus.values())
                .map(actual -> Arguments.of(t[0], t[1], t[2], t[3], actual)));
    }

    @ParameterizedTest @MethodSource("transitions")
    void enforcesTransitionMatrix(String operation, FunctionStatus expected, FunctionStatus target,
                                  AuditAction action, FunctionStatus actual) {
        authenticate("ROLE_CUSTOM", List.of(10L), List.of());
        var function = function(actual, 10L);
        when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function));
        if (actual == expected) {
            execute(operation);
            assertThat(function.getStatus()).isEqualTo(target);
            assertThat(function.getActive()).isEqualTo(target == PUBLISHED);
            verify(audit).function(eq(function), eq(action), eq(operation.equals("reject") ? "Clarify documents" : expected + " -> " + target));
        } else {
            assertThatThrownBy(() -> execute(operation)).isInstanceOf(WorkflowConflictException.class);
            assertThat(function.getStatus()).isEqualTo(actual);
            verifyNoInteractions(audit);
        }
    }

    @Test void queueAndAdminListAreScoped() {
        authenticate("ROLE_CUSTOM", List.of(10L), List.of("FUNCTIONS_REVIEW"));
        service.getAllForAdmin(); service.pendingReview();
        verify(orgFunctionRepository).findAllByOrganizationIdIn(List.of(10L));
        verify(orgFunctionRepository).findAllByStatusAndOrganizationIdIn(PENDING_REVIEW, List.of(10L));
        verify(orgFunctionRepository, never()).findAll();
    }
    @Test void globalEditorSeesAllOrganizations() {
        authenticate("ROLE_CUSTOM", List.of(), List.of("FUNCTIONS_MANAGE_ANY_ORGANIZATION"));
        service.getAllForAdmin(); service.pendingReview();
        verify(orgFunctionRepository).findAll(); verify(orgFunctionRepository).findAllByStatus(PENDING_REVIEW);
    }
    @Test void foreignAuditIsDenied() {
        authenticate("ROLE_CUSTOM", List.of(10L), List.of("AUDIT_VIEW"));
        when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function(DRAFT, 20L)));
        assertThatThrownBy(() -> service.history(1L)).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(auditLogs);
    }
    @Test void unassignedDraftRequiresGlobalScope() {
        authenticate("ROLE_CUSTOM", List.of(10L), List.of("FUNCTIONS_CREATE"));
        assertThatThrownBy(() -> service.create(new CreateOrgFunctionRequest("Draft", null, null, null, null)))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(audit);
    }
    @Test void pendingAndPublishedCannotBeEditedWithoutAnotherReview() {
        authenticate("ROLE_SUPER_ADMIN", List.of(), List.of());
        for (var status : List.of(PENDING_REVIEW, PUBLISHED)) {
            when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function(status, 10L)));
            assertThatThrownBy(() -> service.updateRequirements(1L, "Changed")).isInstanceOf(WorkflowConflictException.class);
        }
    }
    @Test void translationEditRequiresBothPermissions() {
        authenticate("ROLE_SUPER_ADMIN", List.of(), List.of("FUNCTIONS_TRANSLATIONS_EDIT"));
        assertThatThrownBy(() -> service.updateTranslations(1L, new FunctionTranslationsRequest(Map.of("en","New"),null)))
                .isInstanceOf(AccessDeniedException.class).hasMessageContaining("FUNCTIONS_EDIT");
        verifyNoInteractions(orgFunctionRepository);
    }
    @Test void absentPrincipalFailsClosed() {
        when(orgFunctionRepository.findById(1L)).thenReturn(Optional.of(function(PUBLISHED, 10L)));
        assertThatThrownBy(() -> service.deactivate(1L)).isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(audit);
    }
    @Test void rejectionRequiresReason() {
        assertThatThrownBy(() -> service.reject(1L, " ")).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(orgFunctionRepository);
    }
    @Test void creationIsDraftAndAudited() {
        authenticate("ROLE_CUSTOM", List.of(10L), List.of());
        when(orgFunctionRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            OrgFunction f = invocation.getArgument(0); f.setId(8L); return f;
        });
        var function = service.create(new CreateOrgFunctionRequest("New", "Description", 10L, "Documents", null));
        assertThat(function.getStatus()).isEqualTo(DRAFT);
        assertThat(function.getActive()).isFalse();
        verify(organizations).requireExisting(10L);
        verify(audit).function(function, AuditAction.CREATE, "Draft created");
    }

    private void execute(String operation) {
        switch (operation) {
            case "submit" -> service.submitForReview(1L);
            case "reject" -> service.reject(1L, "Clarify documents");
            case "publish" -> service.publish(1L);
            case "reactivate" -> service.reactivate(1L);
            case "deactivate" -> service.deactivate(1L);
            default -> throw new AssertionError(operation);
        }
    }
    private OrgFunction function(FunctionStatus status, Long organizationId) {
        return OrgFunction.builder().id(1L).name("Draft").organizationId(organizationId).status(status).build();
    }
    private void authenticate(String role, List<Long> orgs, List<String> permissions) {
        var principal = new JwtPrincipal("editor@example.com", role, orgs, permissions, 42L);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                principal, null, permissions.stream().map(SimpleGrantedAuthority::new).toList()));
    }
}
