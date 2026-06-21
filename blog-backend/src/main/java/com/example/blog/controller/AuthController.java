package com.example.blog.controller;

import com.example.blog.dto.AuthResponse;
import com.example.blog.dto.ForgotPasswordRequest;
import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.RefreshRequest;
import com.example.blog.dto.RegisterRequest;
import com.example.blog.dto.ResetPasswordRequest;
import com.example.blog.service.PasswordResetService;
import com.example.blog.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Register, login, refresh, logout, and password reset")
public class AuthController {

    private final UserService users;
    private final PasswordResetService passwordReset;

    public AuthController(UserService users, PasswordResetService passwordReset) {
        this.users = users;
        this.passwordReset = passwordReset;
    }

    @Operation(summary = "Create a new account")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(users.register(req));
    }

    @Operation(summary = "Authenticate and receive access + refresh tokens")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return users.login(req);
    }

    @Operation(summary = "Exchange a refresh token for a new access token")
    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return users.refresh(req.refreshToken());
    }

    @Operation(summary = "Revoke a refresh token (logout)")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest req) {
        users.logout(req.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Request a password reset email")
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.initiatePasswordReset(req.email());
        return ResponseEntity.ok(Map.of(
                "message", "If this email is registered you will receive a reset link shortly."));
    }

    @Operation(summary = "Reset password using a valid reset token")
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.resetPassword(req.token(), req.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }
}
