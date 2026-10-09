package adliya.uz.apigateway.security;

public class IntrospectionUnavailableException extends RuntimeException {

    public IntrospectionUnavailableException(String message) {
        super(message);
    }

    public IntrospectionUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
