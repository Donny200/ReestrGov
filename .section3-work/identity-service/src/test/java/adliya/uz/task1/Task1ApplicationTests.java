package adliya.uz.task1;

import adliya.uz.task1.support.RsaTestKeyPair;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class Task1ApplicationTests {

    private static final RsaTestKeyPair JWT_KEYS = RsaTestKeyPair.generate();

    @DynamicPropertySource
    static void jwtKeys(DynamicPropertyRegistry registry) {
        registry.add("jwt.private-key", JWT_KEYS::privateKeyPem);
        registry.add("jwt.public-key", JWT_KEYS::publicKeyPem);
        registry.add("jwt.issuer", () -> "reestr-identity-test");
        registry.add("jwt.audience", () -> "reestr-services-test");
    }

    @Test
    void contextLoads() {
    }

}
