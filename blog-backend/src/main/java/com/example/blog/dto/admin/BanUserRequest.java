package com.example.blog.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record BanUserRequest(
        @NotBlank String reason,
        boolean hideContent
) {}
