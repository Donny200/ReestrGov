package adliya.uz.functioncatalogservice.controller;

import adliya.uz.functioncatalogservice.config.SecurityConfig;
import adliya.uz.functioncatalogservice.entity.OrgFunction;
import adliya.uz.functioncatalogservice.security.JwtAuthenticationFilter;
import adliya.uz.functioncatalogservice.security.SimpleJwtService;
import adliya.uz.functioncatalogservice.service.OrgFunctionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = OrgFunctionController.class,
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false"
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class OrgFunctionControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OrgFunctionService orgFunctionService;

    @MockitoBean
    private SimpleJwtService jwtService;

    @Test
    void publicListRemainsAnonymousAndReturnsOnlyServicePublicResult() throws Exception {
        when(orgFunctionService.getAll()).thenReturn(List.of(function(1L, true)));

        mockMvc.perform(get("/api/functions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].active").value(true));

        verify(orgFunctionService).getAll();
    }

    @Test
    void adminListIsNotMadePublicByBroadGetMatcher() throws Exception {
        mockMvc.perform(get("/api/functions/admin"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(orgFunctionService);
    }

    @Test
    @WithMockUser(authorities = "FUNCTIONS_VIEW")
    void functionsViewCanReadAdminListIncludingInactiveState() throws Exception {
        when(orgFunctionService.getAllForAdmin()).thenReturn(List.of(function(2L, false)));

        mockMvc.perform(get("/api/functions/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].active").value(false));

        verify(orgFunctionService).getAllForAdmin();
    }

    @Test
    @WithMockUser(authorities = "FUNCTIONS_CREATE")
    void functionsCreateCanCreate() throws Exception {
        when(orgFunctionService.create(any())).thenReturn(function(3L, true));

        mockMvc.perform(post("/api/functions")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "Registration",
                                  "organizationId": 10
                                }
                                """))
                .andExpect(status().isCreated());

        verify(orgFunctionService).create(any());
    }

    @Test
    @WithMockUser(authorities = "FUNCTIONS_EDIT")
    void functionsEditCanUpdate() throws Exception {
        when(orgFunctionService.update(eq(3L), any())).thenReturn(function(3L, true));

        mockMvc.perform(put("/api/functions/3")
                        .contentType("application/json")
                        .content("{\"name\":\"Updated registration\"}"))
                .andExpect(status().isOk());

        verify(orgFunctionService).update(eq(3L), any());
    }

    @Test
    @WithMockUser(authorities = "FUNCTIONS_MANAGE_REQUIREMENTS")
    void manageRequirementsCanUpdateRequirements() throws Exception {
        when(orgFunctionService.updateRequirements(3L, "Passport")).thenReturn(function(3L, true));

        mockMvc.perform(put("/api/functions/3/requirements")
                        .contentType("application/json")
                        .content("{\"requirements\":\"Passport\"}"))
                .andExpect(status().isOk());

        verify(orgFunctionService).updateRequirements(3L, "Passport");
    }

    @Test
    @WithMockUser(authorities = "FUNCTIONS_DEACTIVATE")
    void functionsDeactivateCanDeactivate() throws Exception {
        mockMvc.perform(delete("/api/functions/3"))
                .andExpect(status().isNoContent());

        verify(orgFunctionService).deactivate(3L);
    }

    @Test
    @WithMockUser(authorities = "FUNCTIONS_VIEW")
    void unrelatedPermissionCannotDeactivate() throws Exception {
        mockMvc.perform(delete("/api/functions/3"))
                .andExpect(status().isForbidden());

        verify(orgFunctionService, never()).deactivate(3L);
    }

    private OrgFunction function(Long id, boolean active) {
        return OrgFunction.builder()
                .id(id)
                .name("Function " + id)
                .organizationId(10L)
                .status(active ? adliya.uz.functioncatalogservice.entity.FunctionStatus.PUBLISHED : adliya.uz.functioncatalogservice.entity.FunctionStatus.DEACTIVATED)
                .build();
    }
}
