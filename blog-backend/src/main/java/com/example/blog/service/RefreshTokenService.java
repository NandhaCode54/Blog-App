package com.example.blog.service;

import com.example.blog.entity.RefreshToken;
import com.example.blog.entity.User;
import com.example.blog.exception.InvalidCredentialsException;
import com.example.blog.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/** Issues, validates, rotates and revokes opaque DB-backed refresh tokens. */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repo;
    private final long refreshExpirationMs;

    public RefreshTokenService(RefreshTokenRepository repo,
                               @Value("${jwt.refresh-expiration-ms}") long refreshExpirationMs) {
        this.repo = repo;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    /** Create and persist a new refresh token for the given user. */
    public RefreshToken issue(User user) {
        RefreshToken rt = new RefreshToken();
        rt.setToken(UUID.randomUUID().toString());
        rt.setUser(user);
        rt.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));
        rt.setRevoked(false);
        return repo.save(rt);
    }

    /** Validate a presented token string, returning the active entity or failing. */
    public RefreshToken verifyActive(String token) {
        RefreshToken rt = repo.findByToken(token)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid refresh token"));
        if (!rt.isActive()) {
            throw new InvalidCredentialsException("Refresh token expired or revoked");
        }
        return rt;
    }

    /** Rotate: revoke the old token and issue a fresh one for the same user. */
    public RefreshToken rotate(RefreshToken current) {
        current.setRevoked(true);
        repo.save(current);
        return issue(current.getUser());
    }

    public void revoke(String token) {
        repo.findByToken(token).ifPresent(rt -> {
            rt.setRevoked(true);
            repo.save(rt);
        });
    }

    public void revokeAllForUser(User user) {
        repo.revokeAllForUser(user);
    }
}
