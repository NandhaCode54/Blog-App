package com.example.blog.service;

import com.example.blog.dto.CommentRequest;
import com.example.blog.dto.CommentResponse;
import com.example.blog.dto.PageResponse;
import com.example.blog.entity.Comment;
import com.example.blog.entity.Post;
import com.example.blog.entity.Role;
import com.example.blog.entity.User;
import com.example.blog.exception.ForbiddenException;
import com.example.blog.exception.ResourceNotFoundException;
import com.example.blog.repository.CommentRepository;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;
import com.example.blog.security.UserPrincipal;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository comments;
    private final PostRepository posts;
    private final UserRepository users;
    private final NotificationService notifications;

    public CommentService(CommentRepository comments, PostRepository posts,
                          UserRepository users, NotificationService notifications) {
        this.comments = comments;
        this.posts = posts;
        this.users = users;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listByPost(Long postId) {
        if (!posts.existsById(postId)) {
            throw new ResourceNotFoundException("Post not found");
        }
        return comments.findByPostIdWithUser(postId).stream()
                .map(CommentService::toResponse)
                .toList();
    }

    @Transactional
    public CommentResponse create(Long postId, CommentRequest req, Long userId) {
        Post post = posts.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        User user = users.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment c = new Comment();
        c.setPost(post);
        c.setUser(user);
        c.setContent(req.content());
        CommentResponse saved = toResponse(comments.save(c));

        // Notify post author (skip if they commented on their own post)
        Long authorId = post.getUser().getId();
        if (!authorId.equals(userId)) {
            notifications.create(
                    authorId, "COMMENT",
                    user.getName() + " commented on your post",
                    "“" + req.content().substring(0, Math.min(req.content().length(), 80)) + "”",
                    "/posts/" + post.getId());
        }
        return saved;
    }

    @Transactional
    public void delete(Long commentId, UserPrincipal principal) {
        Comment c = comments.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        boolean isOwner = c.getUser().getId().equals(principal.id());
        boolean isAdmin = principal.role() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You can only delete your own comments");
        }
        comments.delete(c);
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> listAll(String search, Pageable pageable) {
        String q = (search == null || search.isBlank()) ? null : search.trim();
        return PageResponse.from(comments.findAllWithSearch(q, pageable), CommentService::toResponse);
    }

    @Transactional
    public void adminDelete(Long commentId) {
        Comment c = comments.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        comments.delete(c);
    }

    private static CommentResponse toResponse(Comment c) {
        return new CommentResponse(
                c.getId(),
                c.getPost().getId(),
                c.getContent(),
                c.getUser().getId(),
                c.getUser().getName(),
                c.getCreatedAt()
        );
    }
}
