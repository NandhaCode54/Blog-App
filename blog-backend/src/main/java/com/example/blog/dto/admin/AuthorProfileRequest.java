package com.example.blog.dto.admin;

public record AuthorProfileRequest(
        String bio,
        String avatarUrl,
        String website,
        String twitter,
        String linkedin
) {}
