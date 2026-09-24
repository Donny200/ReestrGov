package adliya.uz.functioncatalogservice.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(TranslationUnavailableException.class)
    public ResponseEntity<Map<String,Object>> translation(TranslationUnavailableException ex) { return build(ex.status(), ex.getMessage()); }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String,Object>> forbidden(AccessDeniedException ex) { return build(HttpStatus.FORBIDDEN, ex.getMessage()); }
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String,Object>> notFound(NoSuchElementException ex) { return build(HttpStatus.NOT_FOUND, ex.getMessage()); }
    @ExceptionHandler(WorkflowConflictException.class)
    public ResponseEntity<Map<String,Object>> conflict(WorkflowConflictException ex) { return build(HttpStatus.CONFLICT, ex.getMessage()); }
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String,Object>> concurrentEdit(Exception ex) { return build(HttpStatus.CONFLICT, "Card changed concurrently; reload and retry"); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String,Object>> constraint(Exception ex) { return build(HttpStatus.CONFLICT, "A uniqueness or reference constraint prevents this change"); }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,Object>> invalid(IllegalArgumentException ex) { return build(HttpStatus.BAD_REQUEST, ex.getMessage()); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,Object>> validation(MethodArgumentNotValidException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage()).distinct().sorted().reduce((a,b) -> a + "; " + b).orElse("Invalid request"));
    }
    private ResponseEntity<Map<String,Object>> build(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("timestamp", Instant.now().toString(), "status", status.value(),
                "error", status.getReasonPhrase(), "message", message == null ? status.getReasonPhrase() : message));
    }
}
