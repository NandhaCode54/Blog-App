package com.example.blog.controller;

import com.example.blog.entity.MediaFile;
import com.example.blog.security.UserPrincipal;
import com.example.blog.service.MediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/media")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Media", description = "File uploads for images")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @Operation(summary = "Upload an image (authenticated)")
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, String>> upload(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal me) throws IOException {
        MediaFile saved = mediaService.upload(file, me);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("url", saved.getUrl(), "filename", saved.getFilename()));
    }

    @Operation(summary = "List my uploaded files")
    @GetMapping("/mine")
    public List<MediaFile> mine(@AuthenticationPrincipal UserPrincipal me) {
        return mediaService.listMine(me);
    }

    @Operation(summary = "Delete a file (owner or admin)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal me) throws IOException {
        mediaService.delete(id, me);
        return ResponseEntity.noContent().build();
    }
}
