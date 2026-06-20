package com.example.blog.controller;

import com.example.blog.dto.TagResponse;
import com.example.blog.repository.TagRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/tags")
@Tag(name = "Tags", description = "Browse tags")
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
}
