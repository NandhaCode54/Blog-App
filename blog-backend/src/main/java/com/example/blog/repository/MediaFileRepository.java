package com.example.blog.repository;

import com.example.blog.entity.MediaFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {
    Page<MediaFile> findByUploadedByOrderByCreatedAtDesc(Long uploadedBy, Pageable pageable);
    boolean existsByFilename(String filename);
}
