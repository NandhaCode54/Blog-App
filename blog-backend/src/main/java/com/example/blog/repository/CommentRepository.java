package com.example.blog.repository;

import com.example.blog.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId ORDER BY c.createdAt ASC")
    List<Comment> findByPostIdWithUser(Long postId);

    @Query("""
            SELECT c FROM Comment c JOIN FETCH c.user JOIN FETCH c.post
            WHERE (:search IS NULL
                   OR LOWER(c.content) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(c.user.name) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY c.createdAt DESC
            """)
    Page<Comment> findAllWithSearch(@Param("search") String search, Pageable pageable);

    long countByPostId(Long postId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.post.user.id = :authorId")
    long countByAuthorId(@Param("authorId") Long authorId);
}
