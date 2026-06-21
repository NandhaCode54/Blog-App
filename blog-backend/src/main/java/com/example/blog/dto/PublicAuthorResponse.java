package com.example.blog.dto;

public record PublicAuthorResponse(
        Long id,
        String name,
        String email,
        String bio,
        String avatarUrl,
        String website,
        String twitter,
        String linkedin,
        long postCount
) {}
