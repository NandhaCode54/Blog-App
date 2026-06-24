package com.example.blog.controller;

import com.example.blog.dto.CommentResponse;
import com.example.blog.dto.PageResponse;
import com.example.blog.dto.PostResponse;
import com.example.blog.dto.admin.*;
import com.example.blog.security.UserPrincipal;
import com.example.blog.service.AdminUserService;
import com.example.blog.service.AuthorService;
import com.example.blog.service.CommentService;
import com.example.blog.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin", description = "Admin-only management endpoints")
public class AdminUserController {

    private final AdminUserService adminService;
    private final AuthorService authorService;
    private final PostService postService;
    private final CommentService commentService;

    public AdminUserController(AdminUserService adminService, AuthorService authorService,
                                PostService postService, CommentService commentService) {
        this.adminService = adminService;
        this.authorService = authorService;
        this.postService = postService;
        this.commentService = commentService;
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

        return PageResponse.<AdminUserResponse, AdminUserResponse>from(result, r -> r);
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

    // -----------------------------------------------------------------------
    // Author upgrade requests
    // -----------------------------------------------------------------------

    @Operation(summary = "List pending author upgrade requests")
    @GetMapping("/upgrade-requests")
    public List<UpgradeRequestResponse> listUpgradeRequests() {
        return authorService.listPendingRequests();
    }

    @Operation(summary = "Approve an upgrade request")
    @PutMapping("/upgrade-requests/{id}/approve")
    public ResponseEntity<Map<String, String>> approveUpgrade(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal admin) {
        authorService.approveRequest(id, admin);
        return ResponseEntity.ok(Map.of("message", "Request approved"));
    }

    @Operation(summary = "Reject an upgrade request")
    @PutMapping("/upgrade-requests/{id}/reject")
    public ResponseEntity<Map<String, String>> rejectUpgrade(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal admin) {
        authorService.rejectRequest(id, body.getOrDefault("reason", ""), admin);
        return ResponseEntity.ok(Map.of("message", "Request rejected"));
    }

    // -----------------------------------------------------------------------
    // Post moderation
    // -----------------------------------------------------------------------

    @Operation(summary = "List posts awaiting review")
    @GetMapping("/posts/moderation")
    public PageResponse<PostResponse> postsUnderReview(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return postService.listUnderReview(PageRequest.of(page, size, Sort.by("createdAt").ascending()));
    }

    @Operation(summary = "Approve a post (publish it)")
    @PutMapping("/posts/{id}/approve")
    public PostResponse approvePost(@PathVariable Long id,
                                    @AuthenticationPrincipal UserPrincipal admin) {
        return postService.approvePost(id, admin);
    }

    @Operation(summary = "Reject a post (return to author with feedback)")
    @PutMapping("/posts/{id}/reject")
    public PostResponse rejectPost(@PathVariable Long id,
                                   @RequestBody Map<String, String> body,
                                   @AuthenticationPrincipal UserPrincipal admin) {
        return postService.rejectPost(id, body.getOrDefault("reason", ""), admin);
    }

    // -----------------------------------------------------------------------
    // Comments moderation
    // -----------------------------------------------------------------------

    @Operation(summary = "List all comments across the site (paginated)")
    @GetMapping("/comments")
    public PageResponse<CommentResponse> listComments(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return commentService.listAll(search, PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    @Operation(summary = "Delete any comment (admin)")
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id,
                                              @AuthenticationPrincipal UserPrincipal admin) {
        commentService.adminDelete(id);
        return ResponseEntity.noContent().build();
    }
}
