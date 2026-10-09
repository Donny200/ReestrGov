package adliya.uz.functioncatalogservice.security;

import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

final class RsaPublicKeyLoader {

    private RsaPublicKeyLoader() {
    }

    static RSAPublicKey load(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("JWT public key is required");
        }

        String base64 = value
                .replace("\\r", "")
                .replace("\\n", "\n")
                .trim()
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");

        try {
            byte[] encoded = Base64.getDecoder().decode(base64);
            RSAPublicKey key = (RSAPublicKey) KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(encoded));
            if (key.getModulus().bitLength() < 2048) {
                throw new IllegalStateException("JWT public key must be at least 2048 bits");
            }
            return key;
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException illegalStateException) {
                throw illegalStateException;
            }
            throw new IllegalStateException("JWT public key must be a valid X.509 RSA public key", ex);
        }
    }
}
