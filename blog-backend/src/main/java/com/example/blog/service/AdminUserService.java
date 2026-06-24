package com.example.blog.service;

import com.example.blog.dto.admin.*;
import com.example.blog.entity.*;
import com.example.blog.exception.ForbiddenException;
import com.example.blog.exception.ResourceNotFoundException;
import com.example.blog.repository.*;
import com.example.blog.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AdminUserService {

    private final UserRepository users;
    private final AuthorProfileRepository authorProfiles;
    private final AdminAuditLogRepository auditLogs;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final CategoryRepository categories;
    private final TagRepository tags;

    public AdminUserService(UserRepository users,
                            AuthorProfileRepository authorProfiles,
                            AdminAuditLogRepository auditLogs,
                            PostRepository posts,
                            CommentRepository comments,
                            CategoryRepository categories,
                            TagRepository tags) {
        this.users = users;
        this.authorProfiles = authorProfiles;
        this.auditLogs = auditLogs;
        this.posts = posts;
        this.comments = comments;
        this.categories = categories;
        this.tags = tags;
    }

    // -----------------------------------------------------------------------
    // Stats
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
                users.countByRole(Role.USER),
                users.countByRole(Role.AUTHOR),
                users.countByRole(Role.ADMIN),
                users.countByStatus(UserStatus.BANNED),
                posts.count(),
                posts.countByStatus(PostStatus.PUBLISHED),
                posts.countByStatus(PostStatus.DRAFT),
                comments.count(),
                categories.count(),
                tags.count()
        );
    }

    // -----------------------------------------------------------------------
    // User listing & detail
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(String roleStr, String statusStr, String search, Pageable pageable) {
        Role role = roleStr != null ? Role.valueOf(roleStr.toUpperCase()) : null;
        UserStatus status = statusStr != null ? UserStatus.valueOf(statusStr.toUpperCase()) : null;
        return users.findByFilters(role, status, search, pageable)
                .map(this::toUserResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUser(Long id) {
        User u = findUser(id);
        return toUserResponse(u);
    }

    // -----------------------------------------------------------------------
    // Role management
    // -----------------------------------------------------------------------

    @Transactional
    public AdminUserResponse updateRole(Long targetId, UpdateRoleRequest req, UserPrincipal admin) {
        guardSelfModify(targetId, admin.id());
        User u = findUser(targetId);
        Role newRole = Role.valueOf(req.role().toUpperCase());
        Role oldRole = u.getRole();
        u.setRole(newRole);
        users.save(u);
        audit(admin.id(), "ROLE_CHANGE", "USER", targetId,
                oldRole.name() + " -> " + newRole.name());
        return toUserResponse(u);
    }

    // -----------------------------------------------------------------------
    // Ban / unban / suspend
    // -----------------------------------------------------------------------

    @Transactional
    public AdminUserResponse banUser(Long targetId, BanUserRequest req, UserPrincipal admin) {
        guardSelfModify(targetId, admin.id());
        User u = findUser(targetId);
        u.setStatus(UserStatus.BANNED);
        u.setBannedAt(Instant.now());
        u.setBanReason(req.reason());
        u.setHideContent(req.hideContent());
        users.save(u);
        audit(admin.id(), "BAN", "USER", targetId, req.reason());
        return toUserResponse(u);
    }

    @Transactional
    public AdminUserResponse unbanUser(Long targetId, UserPrincipal admin) {
        User u = findUser(targetId);
        u.setStatus(UserStatus.ACTIVE);
        u.setBannedAt(null);
        u.setBanReason(null);
        u.setHideContent(false);
        users.save(u);
        audit(admin.id(), "UNBAN", "USER", targetId, null);
        return toUserResponse(u);
    }

    @Transactional
    public AdminUserResponse suspendUser(Long targetId, BanUserRequest req, UserPrincipal admin) {
        guardSelfModify(targetId, admin.id());
        User u = findUser(targetId);
        u.setStatus(UserStatus.SUSPENDED);
        u.setBanReason(req.reason());
        users.save(u);
        audit(admin.id(), "SUSPEND", "USER", targetId, req.reason());
        return toUserResponse(u);
    }

    // -----------------------------------------------------------------------
    // Author profile management
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<AuthorResponse> listAuthors() {
        List<User> authors = users.findByRoleIn(List.of(Role.AUTHOR, Role.ADMIN));
        return authors.stream().map(this::toAuthorResponse).toList();
    }

    @Transactional(readOnly = true)
    public AuthorResponse getAuthor(Long userId) {
        User u = findUser(userId);
        return toAuthorResponse(u);
    }

    @Transactional
    public AuthorResponse upsertAuthorProfile(Long userId, AuthorProfileRequest req, UserPrincipal admin) {
        AuthorResponse result = upsertProfileInternal(userId, req);
        audit(admin.id(), "PROFILE_UPDATE", "USER", userId, null);
        return result;
    }

    /** Same as above but called by the author themselves — no admin principal required. */
    @Transactional
    public AuthorResponse upsertAuthorProfilePublic(Long userId, AuthorProfileRequest req) {
        return upsertProfileInternal(userId, req);
    }

    private AuthorResponse upsertProfileInternal(Long userId, AuthorProfileRequest req) {
        User u = findUser(userId);
        AuthorProfile profile = authorProfiles.findByUserId(userId)
                .orElseGet(() -> {
                    AuthorProfile p = new AuthorProfile();
                    p.setUser(u);
                    return p;
                });
        profile.setBio(req.bio());
        profile.setAvatarUrl(req.avatarUrl());
        profile.setWebsite(req.website());
        profile.setTwitter(req.twitter());
        profile.setLinkedin(req.linkedin());
        profile.setUpdatedAt(Instant.now());
        authorProfiles.save(profile);
        return toAuthorResponse(u);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private User findUser(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void guardSelfModify(Long targetId, Long adminId) {
        if (targetId.equals(adminId)) {
            throw new ForbiddenException("You cannot modify your own role or status");
        }
    }

    private void audit(Long adminId, String action, String targetType, Long targetId, String detail) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(adminId);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetail(detail);
        auditLogs.save(log);
    }

    private AdminUserResponse toUserResponse(User u) {
        return new AdminUserResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole().name(),
                u.getStatus().name(),
                u.getCreatedAt(),
                u.getBannedAt(),
                u.getBanReason(),
                u.isHideContent(),
                posts.countByUserId(u.getId())
        );
    }

    private AuthorResponse toAuthorResponse(User u) {
        AuthorProfile p = authorProfiles.findByUserId(u.getId()).orElse(null);
        return new AuthorResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getRole().name(),
                u.getStatus().name(),
                u.getCreatedAt(),
                p != null ? p.getBio() : null,
                p != null ? p.getAvatarUrl() : null,
                p != null ? p.getWebsite() : null,
                p != null ? p.getTwitter() : null,
                p != null ? p.getLinkedin() : null,
                posts.countByUserId(u.getId())
        );
    }
}
