package com.example.blog.dto;

public record LoginResponse(
        Long id,
        String email,
        String name,
        String token   // ← NEW
) {}
