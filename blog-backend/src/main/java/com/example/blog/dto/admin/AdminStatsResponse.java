package com.example.blog.dto.admin;

public record AdminStatsResponse(
        long totalUsers,
        long totalAuthors,
        long totalAdmins,
        long bannedUsers,
        long totalPosts,
        long publishedPosts,
        long draftPosts,
        long totalComments,
        long totalCategories,
        long totalTags
) {}
