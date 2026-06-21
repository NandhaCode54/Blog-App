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
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RefreshTokenService refreshTokens;
    private final NotificationService notifications;
    private final Optional<JavaMailSender> mailer;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public UserService(UserRepository repo, PasswordEncoder encoder, JwtService jwt,
                       RefreshTokenService refreshTokens, NotificationService notifications,
                       Optional<JavaMailSender> mailer) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
        this.refreshTokens = refreshTokens;
        this.notifications = notifications;
        this.mailer = mailer;
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

        sendWelcomeNotification(user);
        return issueTokens(user);
    }

    private void sendWelcomeNotification(User user) {
        notifications.create(
                user.getId(), "WELCOME",
                "Welcome to BlogHub!",
                "Start exploring posts, or apply to become an author.",
                "/");
        mailer.ifPresent(m -> {
            try {
                MimeMessage msg = m.createMimeMessage();
                MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
                h.setTo(user.getEmail());
                h.setSubject("Welcome to BlogHub, " + user.getName() + "!");
                h.setText(buildWelcomeHtml(user), true);
                m.send(msg);
            } catch (Exception e) {
                log.warn("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage());
            }
        });
    }

    private String buildWelcomeHtml(User user) {
        return """
                <html><body style="font-family:sans-serif;max-width:520px;margin:0 auto">
                  <h2 style="color:#0d6efd">Welcome to BlogHub!</h2>
                  <p>Hi <strong>%s</strong>, your account is ready.</p>
                  <p>Start reading, or <a href="%s/author/request-upgrade">apply to become an author</a>
                     and share your stories with the world.</p>
                  <a href="%s" style="display:inline-block;margin-top:12px;padding:10px 20px;
                     background:#0d6efd;color:#fff;border-radius:6px;text-decoration:none">
                     Visit BlogHub</a>
                </body></html>
                """.formatted(user.getName(), frontendUrl, frontendUrl);
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
