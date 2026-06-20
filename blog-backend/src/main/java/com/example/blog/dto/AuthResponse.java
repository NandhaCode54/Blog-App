package com.example.blog.dto;

/** Returned by register, login and refresh. */
public record AuthResponse(
        Long id,
        String email,
        String name,
        String role,
        String accessToken,
        String refreshToken
) {}
