package com.example.blog.dto;

import java.time.Instant;

public record PostResponse(Long id, String title, String content, String authorEmail, Instant createdAt) {}
