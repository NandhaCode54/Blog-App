package com.example.blog.service;

import com.example.blog.dto.PostResponse;
import com.example.blog.entity.Post;
import com.example.blog.entity.User;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;
import com.example.blog.util.JwtUtil;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class PostService {

    private final PostRepository posts;
    private final UserRepository users;
    private final JwtUtil jwtUtil;

    public PostService(PostRepository posts, UserRepository users, JwtUtil jwtUtil) {
        this.posts = posts;
        this.users = users;
        this.jwtUtil = jwtUtil;
    }

    public List<PostResponse> list() {
        return posts.findAll().stream()
                .map(p -> new PostResponse(
                        p.getId(),
                        p.getTitle(),
                        p.getContent(),
                        p.getUser().getEmail(),
                        p.getCreatedAt()
                )).toList();
    }

    public Post create(Post post, String token) {
        Long userId = jwtUtil.extractUserId(token);
        User user = users.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        post.setUser(user);
        post.setCreatedAt(Instant.now()); // ✅ This is correct now

        return posts.save(post);
    }

}
