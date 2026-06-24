// PostRepository.java
package com.example.blog.repository;

import com.example.blog.entity.Post;
import com.example.blog.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlug(String slug);

    boolean existsBySlug(String slug);

    /**
     * Paged listing with optional full-text-ish keyword, category and tag filters.
     * Null filter params are ignored.
     */
    @Query("""
            SELECT DISTINCT p FROM Post p
            LEFT JOIN p.tags t
            WHERE p.status = :status
              AND (:q IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%'))
                              OR LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:tag IS NULL OR t.slug = :tag)
            """)
    Page<Post> search(@Param("status") PostStatus status,
                      @Param("q") String q,
                      @Param("categoryId") Long categoryId,
                      @Param("tag") String tag,
                      Pageable pageable);

    Page<Post> findByStatusOrderByCreatedAtDesc(PostStatus status, Pageable pageable);

    long countByUserId(Long userId);
    long countByStatus(PostStatus status);
    long countByUserIdAndStatus(Long userId, PostStatus status);

    Page<Post> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PostStatus status, Pageable pageable);
    Page<Post> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
