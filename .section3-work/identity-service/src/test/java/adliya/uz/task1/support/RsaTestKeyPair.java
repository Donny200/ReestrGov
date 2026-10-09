package adliya.uz.task1.support;

import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;

public record RsaTestKeyPair(RSAPrivateKey privateKey, RSAPublicKey publicKey) {

    public static RsaTestKeyPair generate() {
        return generate(2048);
    }

    public static RsaTestKeyPair generate(int bitLength) {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(bitLength);
            var keyPair = generator.generateKeyPair();
            return new RsaTestKeyPair(
                    (RSAPrivateKey) keyPair.getPrivate(),
                    (RSAPublicKey) keyPair.getPublic()
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to create an ephemeral RSA test key pair", ex);
        }
    }

    public String privateKeyPem() {
        return pem("PRIVATE KEY", privateKey.getEncoded());
    }

    public String publicKeyPem() {
        return pem("PUBLIC KEY", publicKey.getEncoded());
    }

    private static String pem(String type, byte[] encoded) {
        return "-----BEGIN " + type + "-----\n"
                + Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(encoded)
                + "\n-----END " + type + "-----";
    }
}
