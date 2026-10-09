package adliya.uz.functioncatalogservice.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.util.Date;
import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SimpleJwtServiceTest {

    private static final String ISSUER = "reestr-identity";
    private static final String AUDIENCE = "reestr-api";
    private static KeyPair keyPair;
    private static SimpleJwtService service;

    @BeforeAll
    static void setUpKeys() throws Exception {
        keyPair = generateKeyPair();
        service = new SimpleJwtService(publicKeyPem(keyPair), ISSUER, AUDIENCE);
    }

    @Test
    void validatesRs256TokenUsingOnlyPublicKey() {
        String token = Jwts.builder()
                .subject("admin@example.com")
                .issuer(ISSUER)
                .claim("aud", AUDIENCE)
                .id(UUID.randomUUID().toString())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .claim("userId", 10L)
                .claim("tokenType", "access")
                .claim("tokenVersion", 3L)
                .claim("role", "ROLE_SUPER_ADMIN")
                .claim("organizationIds", java.util.List.of(10L, 20L))
                .claim("mustChangePassword", false)
                .signWith((RSAPrivateKey) keyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        var claims = service.parseClaims(token);

        assertThat(claims.getSubject()).isEqualTo("admin@example.com");
        assertThat(claims.get("role", String.class)).isEqualTo("ROLE_SUPER_ADMIN");
        assertThat(claims.get("organizationIds", java.util.List.class)).containsExactly(10, 20);
        assertThat(claims.get("mustChangePassword", Boolean.class)).isFalse();
        assertThat(service.parseAccessToken(token).tokenVersion()).isEqualTo(3L);
    }

    @Test
    void rejectsTokenUntilMandatoryPasswordChangeIsComplete() {
        String token = Jwts.builder()
                .subject("admin@example.com")
                .issuer(ISSUER)
                .claim("aud", AUDIENCE)
                .id(UUID.randomUUID().toString())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .claim("userId", 10L)
                .claim("tokenType", "access")
                .claim("tokenVersion", 0L)
                .claim("role", "ROLE_SUPER_ADMIN")
                .claim("organizationIds", java.util.List.of())
                .claim("mustChangePassword", true)
                .signWith((RSAPrivateKey) keyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        assertThatThrownBy(() -> service.parseClaims(token))
                .isInstanceOf(UnsupportedJwtException.class)
                .hasMessageContaining("password has been changed");
    }

    @Test
    void rejectsTokenWithoutMandatoryPasswordChangeClaim() {
        String token = Jwts.builder()
                .subject("admin@example.com")
                .issuer(ISSUER)
                .claim("aud", AUDIENCE)
                .id(UUID.randomUUID().toString())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .claim("userId", 10L)
                .claim("tokenType", "access")
                .claim("tokenVersion", 0L)
                .claim("role", "ROLE_SUPER_ADMIN")
                .claim("organizationIds", java.util.List.of())
                .signWith((RSAPrivateKey) keyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        assertThatThrownBy(() -> service.parseClaims(token))
                .isInstanceOf(UnsupportedJwtException.class)
                .hasMessageContaining("password has been changed");
    }

    @Test
    void rejectsLegacyHmacToken() {
        var hmacKey = Keys.hmacShaKeyFor(
                "legacy-shared-secret-that-is-long-enough-for-hs256-signatures"
                        .getBytes(StandardCharsets.UTF_8)
        );
        String token = Jwts.builder()
                .subject("admin@example.com")
                .signWith(hmacKey, Jwts.SIG.HS256)
                .compact();

        assertThatThrownBy(() -> service.parseClaims(token))
                .isInstanceOf(UnsupportedJwtException.class);
    }

    @Test
    void rejectsRsaAlgorithmOtherThanRs256() {
        String token = Jwts.builder()
                .subject("admin@example.com")
                .signWith((RSAPrivateKey) keyPair.getPrivate(), Jwts.SIG.RS512)
                .compact();

        assertThatThrownBy(() -> service.parseClaims(token))
                .isInstanceOf(UnsupportedJwtException.class)
                .hasMessageContaining("RS256");
    }

    @Test
    void rejectsTokenSignedByAnotherRsaKey() throws Exception {
        KeyPair anotherKeyPair = generateKeyPair();
        String token = Jwts.builder()
                .subject("admin@example.com")
                .signWith((RSAPrivateKey) anotherKeyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        assertThatThrownBy(() -> service.parseClaims(token))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void failsFastWithoutPublicKey() {
        assertThatThrownBy(() -> new SimpleJwtService(" ", ISSUER, AUDIENCE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT public key is required");
    }

    @Test
    void rejectsRsaPublicKeyShorterThan2048Bits() throws Exception {
        assertThatThrownBy(() -> new SimpleJwtService(
                publicKeyPem(generateKeyPair(1024)), ISSUER, AUDIENCE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT public key must be at least 2048 bits");
    }

    @Test
    void rejectsTokenWithWrongAudience() {
        String token = Jwts.builder()
                .subject("admin@example.com")
                .issuer(ISSUER)
                .claim("aud", "another-api")
                .id(UUID.randomUUID().toString())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .claim("userId", 10L)
                .claim("tokenType", "access")
                .claim("tokenVersion", 0L)
                .claim("mustChangePassword", false)
                .signWith((RSAPrivateKey) keyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        assertThatThrownBy(() -> service.parseClaims(token))
                .isInstanceOf(UnsupportedJwtException.class)
                .hasMessageContaining("audience");
    }

    @Test
    void rejectsRefreshTokenType() {
        String token = Jwts.builder()
                .subject("admin@example.com")
                .issuer(ISSUER)
                .claim("aud", AUDIENCE)
                .id(UUID.randomUUID().toString())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .claim("userId", 10L)
                .claim("tokenType", "refresh")
                .claim("tokenVersion", 0L)
                .claim("mustChangePassword", false)
                .signWith((RSAPrivateKey) keyPair.getPrivate(), Jwts.SIG.RS256)
                .compact();

        assertThatThrownBy(() -> service.parseClaims(token))
                .isInstanceOf(UnsupportedJwtException.class)
                .hasMessageContaining("access tokens");
    }

    private static KeyPair generateKeyPair() throws Exception {
        return generateKeyPair(2048);
    }

    private static KeyPair generateKeyPair(int bitLength) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(bitLength);
        return generator.generateKeyPair();
    }

    private static String publicKeyPem(KeyPair pair) {
        return "-----BEGIN PUBLIC KEY-----\n"
                + Base64.getMimeEncoder(64, new byte[]{'\n'})
                .encodeToString(pair.getPublic().getEncoded())
                + "\n-----END PUBLIC KEY-----";
    }
}
