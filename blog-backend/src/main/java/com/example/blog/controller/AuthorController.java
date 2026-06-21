package com.example.blog.controller;

import com.example.blog.dto.PageResponse;
import com.example.blog.dto.PostResponse;
import com.example.blog.dto.PublicAuthorResponse;
import com.example.blog.service.AuthorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/authors")
@Tag(name = "Authors", description = "Public author profiles and their published posts")
public class AuthorController {

    private final AuthorService authorService;

    public AuthorController(AuthorService authorService) {
        this.authorService = authorService;
    }

    @Operation(summary = "List all public authors")
    @GetMapping
    public List<PublicAuthorResponse> all() {
        return authorService.listPublicAuthors();
    }

    @Operation(summary = "Get a single author's public profile")
    @GetMapping("/{id}")
    public PublicAuthorResponse one(@PathVariable Long id) {
        return authorService.getPublicAuthor(id);
    }

    @Operation(summary = "Get published posts by an author (paged)")
    @GetMapping("/{id}/posts")
    public PageResponse<PostResponse> posts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return authorService.getAuthorPublishedPosts(id, PageRequest.of(page, size));
    }
}
