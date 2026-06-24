package com.example.blog.dto;

import java.time.Instant;
import java.util.List;

public record PostResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String content,
        String status,
        String rejectReason,
        String coverImageUrl,
        int readingTime,
        Long authorId,
        String authorName,
        String authorEmail,
        Long categoryId,
        String categoryName,
        List<String> tags,
        Instant createdAt,
        Instant updatedAt
) {}
