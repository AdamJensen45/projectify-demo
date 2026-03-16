package com.projectflow.exception;

public class ApiConflictException extends RuntimeException {
    public ApiConflictException(String message) {
        super(message);
    }
}
