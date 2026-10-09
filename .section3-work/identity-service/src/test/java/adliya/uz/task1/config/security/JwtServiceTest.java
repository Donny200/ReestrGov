package adliya.uz.task1.config.security;

import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.Role;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.support.RsaTestKeyPair;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final RsaTestKeyPair KEY_PAIR = RsaTestKeyPair.generate();

    @Test
    void generatesAndValidatesRs256TokenWithExistingClaims() {
        JwtService service = service(KEY_PAIR);
        User user = User.builder()
                .id(42L)
                .email("admin@example.com")
                .role(Role.builder().name("ROLE_SUPER_ADMIN").build())
                .organizations(Set.of(
                        Organization.builder().id(10L).build(),
                        Organization.builder().id(20L).build()
                ))
                .mustChangePassword(true)
                .tokenVersion(3L)
                .build();

        String token = service.generateToken(user);
        var parsed = Jwts.parser()
                .verifyWith(KEY_PAIR.publicKey())
                .build()
                .parseSignedClaims(token);

        assertThat(parsed.getHeader().getAlgorithm()).isEqualTo("RS256");
        assertThat(parsed.getPayload().getSubject()).isEqualTo("admin@example.com");
        assertThat(parsed.getPayload().getIssuer()).isEqualTo("reestr-identity-test");
        assertThat(parsed.getPayload().getAudience()).containsExactly("reestr-services-test");
        assertThat(parsed.getPayload().getId()).isNotBlank();
        assertThat(parsed.getPayload().get(JwtService.USER_ID_CLAIM, Number.class).longValue())
                .isEqualTo(42L);
        assertThat(parsed.getPayload().get(JwtService.TOKEN_TYPE_CLAIM, String.class))
                .isEqualTo(JwtService.ACCESS_TOKEN_TYPE);
        assertThat(parsed.getPayload().get(JwtService.TOKEN_VERSION_CLAIM, Number.class).longValue())
                .isEqualTo(3L);
        assertThat(parsed.getPayload().get("role", String.class)).isEqualTo("ROLE_SUPER_ADMIN");
        assertThat(parsed.getPayload().get("organizationIds", java.util.List.class))
                .containsExactlyInAnyOrder(10, 20);
        assertThat(parsed.getPayload().get("mustChangePassword", Boolean.class)).isTrue();
        assertThat(service.extractUsername(token)).isEqualTo("admin@example.com");
    }

    @Test
    void rejectsLegacyHmacToken() {
        JwtService service = service(KEY_PAIR);
        var hmacKey = Keys.hmacShaKeyFor(
                "legacy-shared-secret-that-is-long-enough-for-hs256-signatures"
                        .getBytes(StandardCharsets.UTF_8)
        );
        String token = Jwts.builder()
                .subject("admin@example.com")
                .signWith(hmacKey, Jwts.SIG.HS256)
                .compact();

        assertThatThrownBy(() -> service.extractAllClaims(token))
                .isInstanceOf(UnsupportedJwtException.class);
    }

    @Test
    void rejectsRsaAlgorithmOtherThanRs256() {
        JwtService service = service(KEY_PAIR);
        String token = Jwts.builder()
                .subject("admin@example.com")
                .signWith(KEY_PAIR.privateKey(), Jwts.SIG.RS512)
                .compact();

        assertThatThrownBy(() -> service.extractAllClaims(token))
                .isInstanceOf(UnsupportedJwtException.class)
                .hasMessageContaining("RS256");
    }

    @Test
    void acceptsEnvironmentStyleEscapedNewlines() {
        JwtProperties properties = properties(KEY_PAIR);
        properties.setPrivateKey(properties.getPrivateKey().replace("\n", "\\n"));
        properties.setPublicKey(properties.getPublicKey().replace("\n", "\\n"));
        JwtService service = new JwtService(properties);

        service.init();

        assertThat(service).isNotNull();
    }

    @Test
    void failsFastWhenPrivateAndPublicKeysDoNotMatch() {
        JwtProperties properties = properties(KEY_PAIR);
        properties.setPublicKey(RsaTestKeyPair.generate().publicKeyPem());
        JwtService service = new JwtService(properties);

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("do not form a matching RSA pair");
    }

    @Test
    void failsFastWithoutPrivateKey() {
        JwtProperties properties = properties(KEY_PAIR);
        properties.setPrivateKey(" ");
        JwtService service = new JwtService(properties);

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT private key is required");
    }

    @Test
    void rejectsRsaKeysShorterThan2048Bits() {
        JwtService service = new JwtService(properties(RsaTestKeyPair.generate(1024)));

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT private key must be at least 2048 bits");
    }

    private static JwtService service(RsaTestKeyPair keyPair) {
        JwtService service = new JwtService(properties(keyPair));
        service.init();
        return service;
    }

    private static JwtProperties properties(RsaTestKeyPair keyPair) {
        JwtProperties properties = new JwtProperties();
        properties.setPrivateKey(keyPair.privateKeyPem());
        properties.setPublicKey(keyPair.publicKeyPem());
        properties.setExpiration(60_000L);
        properties.setRefreshExpiration(120_000L);
        properties.setIssuer("reestr-identity-test");
        properties.setAudience("reestr-services-test");
        return properties;
    }
}
