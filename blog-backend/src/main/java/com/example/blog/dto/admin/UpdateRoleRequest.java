package com.example.blog.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record UpdateRoleRequest(
        @NotBlank String role
) {}
