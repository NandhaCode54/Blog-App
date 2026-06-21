package com.example.blog.controller;

import com.example.blog.dto.PageResponse;
import com.example.blog.dto.admin.*;
import com.example.blog.security.UserPrincipal;
import com.example.blog.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin", description = "Admin-only management endpoints")
public class AdminUserController {

    private final AdminUserService adminService;

    public AdminUserController(AdminUserService adminService) {
        this.adminService = adminService;
    }

    // -----------------------------------------------------------------------
    // Stats
    // -----------------------------------------------------------------------

    @Operation(summary = "Platform overview stats")
    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.getStats();
    }

    // -----------------------------------------------------------------------
    // User management
    // -----------------------------------------------------------------------

    @Operation(summary = "List all users (paginated, filterable)")
    @GetMapping("/users")
    public PageResponse<AdminUserResponse> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AdminUserResponse> result = adminService.listUsers(
                role, status, search,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return PageResponse.from(result, r -> r);
    }

    @Operation(summary = "Get user detail")
    @GetMapping("/users/{id}")
    public AdminUserResponse getUser(@PathVariable Long id) {
        return adminService.getUser(id);
    }

    @Operation(summary = "Change a user's role")
    @PutMapping("/users/{id}/role")
    public AdminUserResponse updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest req,
            @AuthenticationPrincipal UserPrincipal admin) {
        return adminService.updateRole(id, req, admin);
    }

    @Operation(summary = "Ban a user")
    @PutMapping("/users/{id}/ban")
    public AdminUserResponse banUser(
            @PathVariable Long id,
            @Valid @RequestBody BanUserRequest req,
            @AuthenticationPrincipal UserPrincipal admin) {
        return adminService.banUser(id, req, admin);
    }

    @Operation(summary = "Unban a user")
    @PutMapping("/users/{id}/unban")
    public AdminUserResponse unbanUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal admin) {
        return adminService.unbanUser(id, admin);
    }

    @Operation(summary = "Suspend a user")
    @PutMapping("/users/{id}/suspend")
    public AdminUserResponse suspendUser(
            @PathVariable Long id,
            @Valid @RequestBody BanUserRequest req,
            @AuthenticationPrincipal UserPrincipal admin) {
        return adminService.suspendUser(id, req, admin);
    }

    // -----------------------------------------------------------------------
    // Author management
    // -----------------------------------------------------------------------

    @Operation(summary = "List all authors and admins")
    @GetMapping("/authors")
    public List<AuthorResponse> listAuthors() {
        return adminService.listAuthors();
    }

    @Operation(summary = "Get author detail")
    @GetMapping("/authors/{id}")
    public AuthorResponse getAuthor(@PathVariable Long id) {
        return adminService.getAuthor(id);
    }

    @Operation(summary = "Create or update an author profile")
    @PutMapping("/authors/{id}/profile")
    public AuthorResponse upsertProfile(
            @PathVariable Long id,
            @RequestBody AuthorProfileRequest req,
            @AuthenticationPrincipal UserPrincipal admin) {
        return adminService.upsertAuthorProfile(id, req, admin);
    }

    // Convenience: promote to author via role endpoint alias
    @Operation(summary = "Promote user to AUTHOR role")
    @PutMapping("/users/{id}/promote-author")
    public AdminUserResponse promoteToAuthor(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal admin) {
        return adminService.updateRole(id, new UpdateRoleRequest("AUTHOR"), admin);
    }
}
