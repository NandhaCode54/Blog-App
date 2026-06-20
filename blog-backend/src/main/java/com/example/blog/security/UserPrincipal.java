package com.example.blog.security;

import com.example.blog.entity.Role;

/** Authenticated principal stored in the SecurityContext, derived from the JWT. */
public record UserPrincipal(Long id, String email, Role role) {}
