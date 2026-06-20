package com.example.blog.service;

import com.example.blog.dto.AuthResponse;
import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.RegisterRequest;
import com.example.blog.entity.RefreshToken;
import com.example.blog.entity.Role;
import com.example.blog.entity.User;
import com.example.blog.exception.EmailAlreadyExistsException;
import com.example.blog.exception.InvalidCredentialsException;
import com.example.blog.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RefreshTokenService refreshTokens;

    public UserService(UserRepository repo, PasswordEncoder encoder, JwtService jwt,
                       RefreshTokenService refreshTokens) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshTokens = refreshTokens;
    }

    /** Create a brand-new account. Fails if the email is already taken. */
    public AuthResponse register(RegisterRequest req) {
        if (repo.findByEmail(req.email()).isPresent()) {
            throw new EmailAlreadyExistsException("An account with this email already exists");
        }

        User user = new User();
        user.setEmail(req.email());
        user.setName(req.name());
        user.setPasswordHashed(encoder.encode(req.password()));
        user.setRole(Role.USER);
        user = repo.save(user);

        return issueTokens(user);
    }

    /** Authenticate an existing account. Never creates a new one. */
    public AuthResponse login(LoginRequest req) {
        User user = repo.findByEmail(req.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!encoder.matches(req.password(), user.getPasswordHashed())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return issueTokens(user);
    }

    /** Exchange a valid refresh token for a new access token (rotating the refresh token). */
    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken current = refreshTokens.verifyActive(refreshTokenValue);
        User user = current.getUser();
        RefreshToken rotated = refreshTokens.rotate(current);
        return new AuthResponse(
                user.getId(), user.getEmail(), user.getName(), user.getRole().name(),
                jwt.generateAccessToken(user), rotated.getToken());
    }

    /** Revoke a refresh token (logout). */
    public void logout(String refreshTokenValue) {
        refreshTokens.revoke(refreshTokenValue);
    }

    private AuthResponse issueTokens(User user) {
        String access = jwt.generateAccessToken(user);
        RefreshToken refresh = refreshTokens.issue(user);
        return new AuthResponse(
                user.getId(), user.getEmail(), user.getName(), user.getRole().name(),
                access, refresh.getToken());
    }
}
