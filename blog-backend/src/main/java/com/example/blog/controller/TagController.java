package com.example.blog.controller;

import com.example.blog.dto.TagResponse;
import com.example.blog.exception.ResourceNotFoundException;
import com.example.blog.repository.TagRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tags")
@Tag(name = "Tags", description = "Browse tags; admins manage them")
public class TagController {

    private final TagRepository tags;

    public TagController(TagRepository tags) {
        this.tags = tags;
    }

    @Operation(summary = "List all tags (public)")
    @GetMapping
    public List<TagResponse> all() {
        return tags.findAll().stream()
                .map(t -> new TagResponse(t.getId(), t.getName(), t.getSlug()))
                .toList();
    }

    @Operation(summary = "Delete a tag (admin only)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        if (!tags.existsById(id)) throw new ResourceNotFoundException("Tag not found");
        tags.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
