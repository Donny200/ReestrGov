package adliya.uz.task1.config.security;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

final class RsaKeyLoader {

    private static final byte[] KEY_PAIR_PROBE = "reestrTask-jwt-key-pair".getBytes(StandardCharsets.UTF_8);

    private RsaKeyLoader() {
    }

    static RSAPrivateKey loadPrivateKey(String value) {
        byte[] encoded = decodePem(value, "PRIVATE KEY", "JWT private key");
        try {
            RSAPrivateKey key = (RSAPrivateKey) KeyFactory.getInstance("RSA")
                    .generatePrivate(new PKCS8EncodedKeySpec(encoded));
            requireStrongKey(key.getModulus().bitLength(), "JWT private key");
            return key;
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException illegalStateException) {
                throw illegalStateException;
            }
            throw new IllegalStateException("JWT private key must be a valid PKCS#8 RSA private key", ex);
        }
    }

    static RSAPublicKey loadPublicKey(String value) {
        byte[] encoded = decodePem(value, "PUBLIC KEY", "JWT public key");
        try {
            RSAPublicKey key = (RSAPublicKey) KeyFactory.getInstance("RSA")
                    .generatePublic(new X509EncodedKeySpec(encoded));
            requireStrongKey(key.getModulus().bitLength(), "JWT public key");
            return key;
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException illegalStateException) {
                throw illegalStateException;
            }
            throw new IllegalStateException("JWT public key must be a valid X.509 RSA public key", ex);
        }
    }

    static void requireMatchingPair(RSAPrivateKey privateKey, RSAPublicKey publicKey) {
        try {
            Signature signer = Signature.getInstance("SHA256withRSA");
            signer.initSign(privateKey);
            signer.update(KEY_PAIR_PROBE);

            Signature verifier = Signature.getInstance("SHA256withRSA");
            verifier.initVerify(publicKey);
            verifier.update(KEY_PAIR_PROBE);

            if (!verifier.verify(signer.sign())) {
                throw new IllegalStateException("JWT private and public keys do not form a matching RSA pair");
            }
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to validate the configured JWT RSA key pair", ex);
        }
    }

    private static byte[] decodePem(String value, String type, String propertyLabel) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(propertyLabel + " is required");
        }

        String normalized = value
                .replace("\\r", "")
                .replace("\\n", "\n")
                .trim();

        if (normalized.contains("BEGIN RSA PRIVATE KEY")) {
            throw new IllegalStateException("JWT private key must use PKCS#8 format (BEGIN PRIVATE KEY)");
        }

        String base64 = normalized
                .replace("-----BEGIN " + type + "-----", "")
                .replace("-----END " + type + "-----", "")
                .replaceAll("\\s", "");

        try {
            return Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(propertyLabel + " is not valid PEM/Base64", ex);
        }
    }

    private static void requireStrongKey(int bitLength, String propertyLabel) {
        if (bitLength < 2048) {
            throw new IllegalStateException(propertyLabel + " must be at least 2048 bits");
        }
    }
}
