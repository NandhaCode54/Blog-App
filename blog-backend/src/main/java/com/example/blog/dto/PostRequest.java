package com.example.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Incoming payload for creating/updating a post. The author is derived from the
 * JWT, never from the request body, to prevent mass-assignment.
 */
public record PostRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must be at most 255 characters")
        String title,

        @NotBlank(message = "Content is required")
        String content,

        @Size(max = 500, message = "Excerpt must be at most 500 characters")
        String excerpt,

        /** "DRAFT" or "PUBLISHED"; defaults to PUBLISHED when omitted. */
        String status,

        Long categoryId,

        List<String> tags,

        @Size(max = 500, message = "Cover image URL must be at most 500 characters")
        String coverImageUrl
) {}
