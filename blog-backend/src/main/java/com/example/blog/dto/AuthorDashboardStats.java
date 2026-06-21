package com.example.blog.dto;

public record AuthorDashboardStats(
        long publishedPosts,
        long draftPosts,
        long totalComments
) {}
