package adliya.uz.referenceservice.security;

import adliya.uz.referenceservice.controller.InterfaceTranslationController;
import adliya.uz.referenceservice.service.InterfaceTranslationService;
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
        controllers = InterfaceTranslationController.class,
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
    private InterfaceTranslationService translationService;

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
        mockMvc.perform(put("/api/interface-translations/en")
                        .contentType("application/json")
                        .content("{\"translations\":{\"button.save\":\"Save\"}}"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(translationService);
    }
}
