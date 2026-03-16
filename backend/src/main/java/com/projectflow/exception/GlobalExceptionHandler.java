package com.projectflow.exception;

import com.projectflow.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProjectService.ForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(ProjectService.ForbiddenException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", e.getMessage(), "code", "FORBIDDEN"));
    }

    @ExceptionHandler(ApiForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleApiForbidden(ApiForbiddenException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", e.getMessage(), "code", "FORBIDDEN"));
    }

    @ExceptionHandler(ApiNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ApiNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", e.getMessage(), "code", "NOT_FOUND"));
    }

    @ExceptionHandler(ApiConflictException.class)
    public ResponseEntity<Map<String, String>> handleConflict(ApiConflictException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", e.getMessage(), "code", "CONFLICT"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .body(Map.of("message", message, "code", "VALIDATION_ERROR"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntime(RuntimeException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Bad request", "code", "BAD_REQUEST"));
    }
}
