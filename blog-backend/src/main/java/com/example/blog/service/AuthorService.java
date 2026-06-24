package com.example.blog.service;

import com.example.blog.dto.*;
import com.example.blog.dto.admin.UpgradeRequestResponse;
import com.example.blog.entity.*;
import com.example.blog.exception.ConflictException;
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
public class AuthorService {

    private final UserRepository users;
    private final AuthorProfileRepository authorProfiles;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final AuthorUpgradeRequestRepository upgradeRequests;
    private final NotificationService notifications;

    public AuthorService(UserRepository users,
                         AuthorProfileRepository authorProfiles,
                         PostRepository posts,
                         CommentRepository comments,
                         AuthorUpgradeRequestRepository upgradeRequests,
                         NotificationService notifications) {
        this.users = users;
        this.authorProfiles = authorProfiles;
        this.posts = posts;
        this.comments = comments;
        this.upgradeRequests = upgradeRequests;
        this.notifications = notifications;
    }

    // -----------------------------------------------------------------------
    // Public — author listing & profiles
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<PublicAuthorResponse> listPublicAuthors() {
        return users.findByRoleIn(List.of(Role.AUTHOR, Role.ADMIN))
                .stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .map(this::toPublicAuthor)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicAuthorResponse getPublicAuthor(Long id) {
        User u = findUser(id);
        if (u.getRole() == Role.USER || u.getStatus() != UserStatus.ACTIVE) {
            throw new ResourceNotFoundException("Author not found");
        }
        return toPublicAuthor(u);
    }

    /** Returns own author profile without role check — used by the author dashboard self-edit. */
    @Transactional(readOnly = true)
    public PublicAuthorResponse getPublicAuthorForSelf(Long userId) {
        return toPublicAuthor(findUser(userId));
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getAuthorPublishedPosts(Long authorId, Pageable pageable) {
        Page<Post> page = posts.findByUserIdAndStatusOrderByCreatedAtDesc(
                authorId, PostStatus.PUBLISHED, pageable);
        return PageResponse.from(page, AuthorService::toPostResponse);
    }

    // -----------------------------------------------------------------------
    // Author dashboard (authenticated, own data)
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public AuthorDashboardStats getMyStats(Long userId) {
        long published = posts.countByUserIdAndStatus(userId, PostStatus.PUBLISHED);
        long draft = posts.countByUserIdAndStatus(userId, PostStatus.DRAFT);
        long totalComments = comments.countByAuthorId(userId);
        return new AuthorDashboardStats(published, draft, totalComments);
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getMyPosts(Long userId, String statusFilter, Pageable pageable) {
        Page<Post> page;
        if (statusFilter != null && !statusFilter.isBlank()) {
            PostStatus ps = PostStatus.valueOf(statusFilter.toUpperCase());
            page = posts.findByUserIdAndStatusOrderByCreatedAtDesc(userId, ps, pageable);
        } else {
            page = posts.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
        return PageResponse.from(page, AuthorService::toPostResponse);
    }

    // -----------------------------------------------------------------------
    // Upgrade requests — user side
    // -----------------------------------------------------------------------

    @Transactional
    public void requestUpgrade(Long userId, String message) {
        if (upgradeRequests.existsByUserId(userId)) {
            throw new ConflictException("You already have a pending upgrade request");
        }
        User u = findUser(userId);
        if (u.getRole() != Role.USER) {
            throw new ConflictException("Only regular users can request an upgrade");
        }
        AuthorUpgradeRequest req = new AuthorUpgradeRequest();
        req.setUser(u);
        req.setMessage(message);
        upgradeRequests.save(req);

        // Notify all admins
        users.findAll().stream()
                .filter(a -> a.getRole() == Role.ADMIN)
                .forEach(admin -> notifications.create(
                        admin.getId(), "UPGRADE_REQUEST",
                        u.getName() + " requested author upgrade",
                        message != null ? message : "No message provided.",
                        "/admin/upgrade-requests"));
    }

    @Transactional(readOnly = true)
    public String getMyRequestStatus(Long userId) {
        return upgradeRequests.findByUserId(userId)
                .map(AuthorUpgradeRequest::getStatus)
                .orElse("NONE");
    }

    // -----------------------------------------------------------------------
    // Upgrade requests — admin side
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<UpgradeRequestResponse> listPendingRequests() {
        return upgradeRequests.findByStatusOrderByCreatedAtDesc("PENDING")
                .stream()
                .map(this::toRequestResponse)
                .toList();
    }

    @Transactional
    public void approveRequest(Long requestId, UserPrincipal admin) {
        AuthorUpgradeRequest req = findRequest(requestId);
        assertPending(req);
        req.setStatus("APPROVED");
        req.setReviewedBy(admin.id());
        req.setReviewedAt(Instant.now());
        upgradeRequests.save(req);

        User u = req.getUser();
        u.setRole(Role.AUTHOR);
        users.save(u);

        notifications.create(u.getId(), "UPGRADE_APPROVED",
                "You are now an author!",
                "Your request was approved. Start creating posts from your dashboard.",
                "/dashboard");
    }

    @Transactional
    public void rejectRequest(Long requestId, String reason, UserPrincipal admin) {
        AuthorUpgradeRequest req = findRequest(requestId);
        assertPending(req);
        req.setStatus("REJECTED");
        req.setRejectReason(reason);
        req.setReviewedBy(admin.id());
        req.setReviewedAt(Instant.now());
        upgradeRequests.save(req);

        notifications.create(req.getUser().getId(), "UPGRADE_REJECTED",
                "Author upgrade request declined",
                reason != null && !reason.isBlank() ? reason : "Your request was reviewed and declined.",
                null);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private User findUser(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AuthorUpgradeRequest findRequest(Long id) {
        return upgradeRequests.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
    }

    private void assertPending(AuthorUpgradeRequest req) {
        if (!"PENDING".equals(req.getStatus())) {
            throw new ForbiddenException("Request has already been reviewed");
        }
    }

    private PublicAuthorResponse toPublicAuthor(User u) {
        AuthorProfile p = authorProfiles.findByUserId(u.getId()).orElse(null);
        return new PublicAuthorResponse(
                u.getId(),
                u.getName(),
                u.getEmail(),
                p != null ? p.getBio() : null,
                p != null ? p.getAvatarUrl() : null,
                p != null ? p.getWebsite() : null,
                p != null ? p.getTwitter() : null,
                p != null ? p.getLinkedin() : null,
                posts.countByUserIdAndStatus(u.getId(), PostStatus.PUBLISHED)
        );
    }

    private UpgradeRequestResponse toRequestResponse(AuthorUpgradeRequest r) {
        User u = r.getUser();
        return new UpgradeRequestResponse(
                r.getId(),
                u.getId(),
                u.getName(),
                u.getEmail(),
                r.getMessage(),
                r.getStatus(),
                r.getRejectReason(),
                r.getCreatedAt(),
                r.getReviewedAt()
        );
    }

    private static PostResponse toPostResponse(Post p) {
        User author = p.getUser();
        var category = p.getCategory();
        List<String> tagNames = p.getTags().stream().map(Tag::getName).sorted().toList();
        return new PostResponse(
                p.getId(), p.getTitle(), p.getSlug(), p.getExcerpt(), p.getContent(),
                p.getStatus().name(), p.getRejectReason(), p.getCoverImageUrl(),
                p.getReadingTime(),
                author.getId(), author.getName(), author.getEmail(),
                category == null ? null : category.getId(),
                category == null ? null : category.getName(),
                tagNames, p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
