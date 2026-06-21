package com.example.blog.repository;

import com.example.blog.entity.Role;
import com.example.blog.entity.User;
import com.example.blog.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByRole(Role role);
    boolean existsByEmail(String email);

    @Query("""
        SELECT u FROM User u
        WHERE (:role IS NULL OR u.role = :role)
          AND (:status IS NULL OR u.status = :status)
          AND (:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<User> findByFilters(
        @Param("role") Role role,
        @Param("status") UserStatus status,
        @Param("search") String search,
        Pageable pageable
    );

    List<User> findByRoleIn(List<Role> roles);

    long countByRole(Role role);
    long countByStatus(UserStatus status);
}
