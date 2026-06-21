package com.example.blog.dto.admin;

import java.time.Instant;

public record AuthorResponse(
        Long userId,
        String name,
        String email,
        String role,
        String status,
        Instant createdAt,
        String bio,
        String avatarUrl,
        String website,
        String twitter,
        String linkedin,
        long postCount
) {}
