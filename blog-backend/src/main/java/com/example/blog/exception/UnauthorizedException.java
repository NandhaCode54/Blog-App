package com.example.blog.exception;

/** Thrown when a request lacks a valid authentication token. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
