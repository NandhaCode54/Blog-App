package com.example.blog.dto.admin;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        String role,
        String status,
        Instant createdAt,
        Instant bannedAt,
        String banReason,
        boolean hideContent,
        long postCount
) {}
