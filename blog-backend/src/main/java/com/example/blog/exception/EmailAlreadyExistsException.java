package com.example.blog.exception;

/** Thrown when registration is attempted with an email that already exists. */
public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
