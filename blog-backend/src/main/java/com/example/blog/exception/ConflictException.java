package com.example.blog.exception;

/** Thrown when a request conflicts with existing state (e.g. duplicate name). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
