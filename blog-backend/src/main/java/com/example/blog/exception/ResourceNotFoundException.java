package com.example.blog.exception;

/** Thrown when a requested entity (user, post, …) cannot be found. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
