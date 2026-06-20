package com.example.blog.dto;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long postId,
        String content,
        Long authorId,
        String authorName,
        Instant createdAt
) {}
