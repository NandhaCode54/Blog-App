package com.example.blog.service;

import com.example.blog.dto.PageResponse;
import com.example.blog.dto.PostRequest;
import com.example.blog.dto.PostResponse;
import com.example.blog.entity.*;
import com.example.blog.exception.ForbiddenException;
import com.example.blog.exception.ResourceNotFoundException;
import com.example.blog.repository.CategoryRepository;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.TagRepository;
import com.example.blog.repository.UserRepository;
import com.example.blog.security.UserPrincipal;
import com.example.blog.util.SlugUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class PostService {

    private static final int WORDS_PER_MINUTE = 200;

    private final PostRepository posts;
    private final UserRepository users;
    private final CategoryRepository categories;
    private final TagRepository tags;
    private final NotificationService notifications;

    public PostService(PostRepository posts, UserRepository users,
                       CategoryRepository categories, TagRepository tags,
                       NotificationService notifications) {
        this.posts = posts;
        this.users = users;
        this.categories = categories;
        this.tags = tags;
        this.notifications = notifications;
    }

    /** Paged, filtered listing of PUBLISHED posts. */
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> list(String q, Long categoryId, String tag, Pageable pageable) {
        String query = (q == null || q.isBlank()) ? null : q.trim();
        Page<Post> page = posts.search(PostStatus.PUBLISHED, query, categoryId, tag, pageable);
        return PageResponse.from(page, PostService::toResponse);
    }

    @Transactional(readOnly = true)
    public PostResponse getById(Long id) {
        return toResponse(findOr404(id));
    }

    @Transactional(readOnly = true)
    public PostResponse getBySlug(String slug) {
        Post post = posts.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        return toResponse(post);
    }

    @Transactional
    public PostResponse create(PostRequest req, Long userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Post post = new Post();
        post.setUser(user);
        post.setCreatedAt(Instant.now());
        post.setSlug(SlugUtil.uniqueSlug(req.title(), posts::existsBySlug));
        applyRequest(post, req);

        return toResponse(posts.save(post));
    }

    @Transactional
    public PostResponse update(Long id, PostRequest req, UserPrincipal principal) {
        Post post = findOr404(id);
        requireOwnerOrAdmin(post, principal);
        applyRequest(post, req);
        post.setUpdatedAt(Instant.now());
        return toResponse(posts.save(post));
    }

    @Transactional
    public void delete(Long id, UserPrincipal principal) {
        Post post = findOr404(id);
        requireOwnerOrAdmin(post, principal);
        posts.delete(post);
    }

    // ---- Moderation -------------------------------------------------------

    @Transactional
    public PostResponse submitForReview(Long id, UserPrincipal principal) {
        Post post = findOr404(id);
        if (!post.getUser().getId().equals(principal.id())) {
            throw new ForbiddenException("You can only submit your own posts for review");
        }
        if (post.getStatus() != PostStatus.DRAFT && post.getStatus() != PostStatus.REJECTED) {
            throw new ForbiddenException("Only DRAFT or REJECTED posts can be submitted for review");
        }
        post.setStatus(PostStatus.UNDER_REVIEW);
        post.setRejectReason(null);
        post.setUpdatedAt(Instant.now());

        // Notify admins
        users.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .forEach(a -> notifications.create(
                        a.getId(), "POST_REVIEW",
                        post.getUser().getName() + " submitted a post for review",
                        post.getTitle(),
                        "/admin/posts/moderation"));
        return toResponse(posts.save(post));
    }

    @Transactional
    public PostResponse approvePost(Long id, UserPrincipal admin) {
        Post post = findOr404(id);
        if (post.getStatus() != PostStatus.UNDER_REVIEW) {
            throw new ForbiddenException("Post is not under review");
        }
        post.setStatus(PostStatus.PUBLISHED);
        post.setReviewedBy(admin.id());
        post.setReviewedAt(Instant.now());
        post.setRejectReason(null);
        post.setUpdatedAt(Instant.now());

        notifications.create(post.getUser().getId(), "POST_APPROVED",
                "Your post was published!",
                post.getTitle(),
                "/posts/" + post.getId());
        return toResponse(posts.save(post));
    }

    @Transactional
    public PostResponse rejectPost(Long id, String reason, UserPrincipal admin) {
        Post post = findOr404(id);
        if (post.getStatus() != PostStatus.UNDER_REVIEW) {
            throw new ForbiddenException("Post is not under review");
        }
        post.setStatus(PostStatus.REJECTED);
        post.setRejectReason(reason);
        post.setReviewedBy(admin.id());
        post.setReviewedAt(Instant.now());
        post.setUpdatedAt(Instant.now());

        notifications.create(post.getUser().getId(), "POST_REJECTED",
                "Your post needs changes",
                reason != null && !reason.isBlank() ? reason : "Review feedback pending.",
                "/dashboard");
        return toResponse(posts.save(post));
    }

    @Transactional(readOnly = true)
    public PageResponse<PostResponse> listUnderReview(Pageable pageable) {
        Page<Post> page = posts.findByStatusOrderByCreatedAtDesc(PostStatus.UNDER_REVIEW, pageable);
        return PageResponse.from(page, PostService::toResponse);
    }

    // ------------------------------------------------------------------ helpers

    private void applyRequest(Post post, PostRequest req) {
        post.setTitle(req.title());
        post.setContent(req.content());
        post.setExcerpt(deriveExcerpt(req));
        post.setStatus(parseStatus(req.status()));
        post.setReadingTime(estimateReadingTime(req.content()));
        post.setCategory(resolveCategory(req.categoryId()));
        post.setTags(resolveTags(req.tags()));
        post.setCoverImageUrl(req.coverImageUrl());
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categories.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private Set<Tag> resolveTags(List<String> names) {
        Set<Tag> result = new LinkedHashSet<>();
        if (names == null) return result;
        for (String raw : names) {
            if (raw == null || raw.isBlank()) continue;
            String name = raw.trim();
            Tag tag = tags.findByName(name).orElseGet(() -> {
                Tag t = new Tag();
                t.setName(name);
                t.setSlug(SlugUtil.uniqueSlug(name, s -> tags.findBySlug(s).isPresent()));
                return tags.save(t);
            });
            result.add(tag);
        }
        return result;
    }

    private static String deriveExcerpt(PostRequest req) {
        if (req.excerpt() != null && !req.excerpt().isBlank()) {
            return req.excerpt().trim();
        }
        String content = req.content() == null ? "" : req.content().strip();
        return content.length() <= 200 ? content : content.substring(0, 200) + "…";
    }

    private static PostStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return PostStatus.PUBLISHED;
        try {
            return PostStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PostStatus.PUBLISHED;
        }
    }

    private static int estimateReadingTime(String content) {
        if (content == null || content.isBlank()) return 1;
        int words = content.trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil(words / (double) WORDS_PER_MINUTE));
    }

    private Post findOr404(Long id) {
        return posts.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
    }

    private void requireOwnerOrAdmin(Post post, UserPrincipal principal) {
        boolean isOwner = post.getUser().getId().equals(principal.id());
        boolean isAdmin = principal.role() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You can only modify your own posts");
        }
    }

    private static PostResponse toResponse(Post p) {
        User author = p.getUser();
        Category category = p.getCategory();
        List<String> tagNames = p.getTags().stream().map(Tag::getName).sorted().toList();
        return new PostResponse(
                p.getId(),
                p.getTitle(),
                p.getSlug(),
                p.getExcerpt(),
                p.getContent(),
                p.getStatus().name(),
                p.getRejectReason(),
                p.getCoverImageUrl(),
                p.getReadingTime(),
                author.getId(),
                author.getName(),
                author.getEmail(),
                category == null ? null : category.getId(),
                category == null ? null : category.getName(),
                tagNames,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
