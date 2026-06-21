package com.example.blog.service;

import com.example.blog.entity.MediaFile;
import com.example.blog.exception.ForbiddenException;
import com.example.blog.repository.MediaFileRepository;
import com.example.blog.security.UserPrincipal;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
    );

    private final MediaFileRepository repo;

    @Value("${app.media.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.media.base-url:http://localhost:8080/media}")
    private String baseUrl;

    public MediaService(MediaFileRepository repo) {
        this.repo = repo;
    }

    @PostConstruct
    public void init() throws IOException {
        Files.createDirectories(Paths.get(uploadDir));
    }

    @Transactional
    public MediaFile upload(MultipartFile file, UserPrincipal uploader) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ForbiddenException("No file provided");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ForbiddenException("File type not allowed. Accepted: JPEG, PNG, GIF, WebP, SVG");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ForbiddenException("File too large. Maximum size is 5 MB");
        }

        String ext = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        Path dest = Paths.get(uploadDir).resolve(filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        MediaFile media = new MediaFile();
        media.setFilename(filename);
        media.setOriginalName(file.getOriginalFilename() != null ? file.getOriginalFilename() : filename);
        media.setContentType(contentType);
        media.setSizeBytes(file.getSize());
        media.setUrl(baseUrl + "/" + filename);
        media.setUploadedBy(uploader.id());
        return repo.save(media);
    }

    @Transactional(readOnly = true)
    public List<MediaFile> listMine(UserPrincipal user) {
        return repo.findByUploadedByOrderByCreatedAtDesc(user.id(),
                org.springframework.data.domain.PageRequest.of(0, 50)).getContent();
    }

    @Transactional
    public void delete(Long id, UserPrincipal user) throws IOException {
        MediaFile media = repo.findById(id)
                .orElseThrow(() -> new com.example.blog.exception.ResourceNotFoundException("File not found"));

        boolean isOwner = user.id().equals(media.getUploadedBy());
        boolean isAdmin = user.role() == com.example.blog.entity.Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You can only delete your own files");
        }

        Path file = Paths.get(uploadDir).resolve(media.getFilename());
        Files.deleteIfExists(file);
        repo.delete(media);
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return (dot >= 0 && dot < filename.length() - 1) ? filename.substring(dot + 1).toLowerCase() : "";
    }
}
