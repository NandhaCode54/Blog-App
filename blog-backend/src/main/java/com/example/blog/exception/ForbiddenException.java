package com.example.blog.exception;

/** Thrown when an authenticated user tries to act on a resource they don't own. */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
