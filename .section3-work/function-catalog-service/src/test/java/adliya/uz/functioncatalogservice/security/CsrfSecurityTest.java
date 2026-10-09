package adliya.uz.functioncatalogservice.security;

import adliya.uz.functioncatalogservice.config.SecurityConfig;
import adliya.uz.functioncatalogservice.controller.OrgFunctionController;
import adliya.uz.functioncatalogservice.service.OrgFunctionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = OrgFunctionController.class,
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false"
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CookieProperties.class})
class CsrfSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OrgFunctionService orgFunctionService;

    @MockitoBean
    private SimpleJwtService jwtService;

    @MockitoBean
    private IdentityTokenIntrospectionClient introspectionClient;

    @MockitoBean
    private TokenIntrospectionProperties introspectionProperties;

    @Autowired
    private CookieProperties cookieProperties;

    @BeforeEach
    void configureCookie() {
        cookieProperties.setSecure(true);
        cookieProperties.setSameSite("Strict");
        when(introspectionProperties.getAccessTokenCookieName()).thenReturn("accessToken");
    }

    @Test
    void mutationWithoutCsrfHeaderIsRejectedBeforeServiceCall() throws Exception {
        mockMvc.perform(put("/api/functions/7/requirements")
                        .contentType("application/json")
                        .content("{\"requirements\":\"Passport\"}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(orgFunctionService);
    }
}
