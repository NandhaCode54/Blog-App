package com.example.blog.exception;

/** Thrown when login fails because the email is unknown or the password is wrong. */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
