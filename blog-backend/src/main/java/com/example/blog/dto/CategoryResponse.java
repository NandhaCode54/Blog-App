package com.example.blog.dto;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description
) {}
