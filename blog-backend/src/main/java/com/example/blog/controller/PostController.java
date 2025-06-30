// PostController.java
package com.example.blog.controller;

import com.example.blog.dto.PostResponse;
import com.example.blog.entity.Post;
import com.example.blog.repository.PostRepository;
import com.example.blog.repository.UserRepository;
import com.example.blog.service.PostService;
import com.example.blog.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/posts")
@CrossOrigin(origins = "http://localhost:5173")   // <‑‑ adjust if your front‑end runs elsewhere
public class PostController {

    private final PostService posts;

    public PostController(PostService posts) {
        this.posts = posts;
    }


    /** List all posts (public) */
    @GetMapping
    public List<PostResponse> all() {
        return posts.list();
    }

    /** Create a post (requires JWT in Authorization header) */
    @PostMapping
    public ResponseEntity<Post> create(@RequestBody Post post,
                                       @RequestHeader("Authorization") String authHeader) {

        // Expect header exactly:  Authorization: Bearer <jwt>
        String token = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7)
                : null;

        if (token == null) {
            return ResponseEntity.status(401).build();
        }

        Post saved = posts.create(post, token);
        return ResponseEntity.ok(saved);
    }
}
