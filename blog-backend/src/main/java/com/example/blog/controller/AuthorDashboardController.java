package com.example.blog.controller;

import com.example.blog.dto.AuthorDashboardStats;
import com.example.blog.dto.PageResponse;
import com.example.blog.dto.PostResponse;
import com.example.blog.security.UserPrincipal;
import com.example.blog.service.AuthorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/author")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Author Dashboard", description = "Private endpoints for the logged-in author")
public class AuthorDashboardController {

    private final AuthorService authorService;

    public AuthorDashboardController(AuthorService authorService) {
        this.authorService = authorService;
    }

    @Operation(summary = "My stats (posts, drafts, comments received)")
    @GetMapping("/me/stats")
    public AuthorDashboardStats myStats(@AuthenticationPrincipal UserPrincipal me) {
        return authorService.getMyStats(me.id());
    }

    @Operation(summary = "My posts (all statuses, paged)")
    @GetMapping("/me/posts")
    public PageResponse<PostResponse> myPosts(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return authorService.getMyPosts(me.id(), status, PageRequest.of(page, size));
    }

    @Operation(summary = "Request upgrade to Author role")
    @PostMapping("/request-upgrade")
    public ResponseEntity<Map<String, String>> requestUpgrade(
            @AuthenticationPrincipal UserPrincipal me,
            @RequestBody(required = false) Map<String, String> body) {
        String message = body != null ? body.getOrDefault("message", null) : null;
        authorService.requestUpgrade(me.id(), message);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Upgrade request submitted"));
    }

    @Operation(summary = "Check my upgrade request status")
    @GetMapping("/request-upgrade/status")
    public Map<String, String> upgradeStatus(@AuthenticationPrincipal UserPrincipal me) {
        return Map.of("status", authorService.getMyRequestStatus(me.id()));
    }
}
