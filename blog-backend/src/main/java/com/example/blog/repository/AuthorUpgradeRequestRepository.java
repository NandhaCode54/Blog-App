package com.example.blog.repository;

import com.example.blog.entity.AuthorUpgradeRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AuthorUpgradeRequestRepository extends JpaRepository<AuthorUpgradeRequest, Long> {
    Optional<AuthorUpgradeRequest> findByUserId(Long userId);
    List<AuthorUpgradeRequest> findByStatusOrderByCreatedAtDesc(String status);
    boolean existsByUserId(Long userId);
}
