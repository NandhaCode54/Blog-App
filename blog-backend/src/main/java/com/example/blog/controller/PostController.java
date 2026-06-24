package com.example.blog.controller;

import com.example.blog.dto.PageResponse;
import com.example.blog.dto.PostRequest;
import com.example.blog.dto.PostResponse;
import com.example.blog.security.UserPrincipal;
import com.example.blog.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/posts")
@Tag(name = "Posts", description = "Create, read, update and delete blog posts")
public class PostController {

    private static final int MAX_PAGE_SIZE = 50;

    private final PostService posts;

    public PostController(PostService posts) {
        this.posts = posts;
    }

    @Operation(summary = "List published posts (paged, searchable, filterable)")
    @GetMapping
    public PageResponse<PostResponse> all(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Sort sortSpec = parseSort(sort);
        return posts.list(q, category, tag, PageRequest.of(Math.max(page, 0), safeSize, sortSpec));
    }

    @Operation(summary = "Get a single post by id (public)")
    @GetMapping("/{id}")
    public PostResponse one(@PathVariable Long id) {
        return posts.getById(id);
    }

    @Operation(summary = "Get a single post by slug (public)")
    @GetMapping("/slug/{slug}")
    public PostResponse bySlug(@PathVariable String slug) {
        return posts.getBySlug(slug);
    }

    @Operation(summary = "Create a post (authenticated)")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody PostRequest req,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(posts.create(req, principal.id()));
    }

    @Operation(summary = "Update a post (owner or admin)")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}")
    public PostResponse update(@PathVariable Long id,
                               @Valid @RequestBody PostRequest req,
                               @AuthenticationPrincipal UserPrincipal principal) {
        return posts.update(id, req, principal);
    }

    @Operation(summary = "Delete a post (owner or admin)")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        posts.delete(id, principal);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Submit a draft post for admin review (owner only)")
    @SecurityRequirement(name = "bearerAuth")
    @PutMapping("/{id}/submit-for-review")
    public PostResponse submitForReview(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        return posts.submitForReview(id, principal);
    }

    /** Parse "field,dir" (e.g. "createdAt,desc"); falls back to newest-first. */
    private Sort parseSort(String sort) {
        String[] parts = sort.split(",");
        String field = parts.length > 0 && !parts[0].isBlank() ? parts[0].trim() : "createdAt";
        Sort.Direction dir = (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        // whitelist sortable fields to avoid arbitrary property injection
        if (!field.equals("createdAt") && !field.equals("title") && !field.equals("readingTime")) {
            field = "createdAt";
        }
        return Sort.by(dir, field);
    }
}
