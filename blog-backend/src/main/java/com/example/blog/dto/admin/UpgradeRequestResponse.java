package com.example.blog.dto.admin;

import java.time.Instant;

public record UpgradeRequestResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        String message,
        String status,
        String rejectReason,
        Instant createdAt,
        Instant reviewedAt
) {}
