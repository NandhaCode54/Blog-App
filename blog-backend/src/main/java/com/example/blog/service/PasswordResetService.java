package com.example.blog.service;

import com.example.blog.entity.PasswordResetToken;
import com.example.blog.entity.User;
import com.example.blog.exception.InvalidTokenException;
import com.example.blog.repository.PasswordResetTokenRepository;
import com.example.blog.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
@Transactional
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_EXPIRY_MINUTES = 15;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PasswordResetTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final Optional<JavaMailSender> mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@bloghub.com}")
    private String mailFrom;

    public PasswordResetService(PasswordResetTokenRepository tokenRepo,
                                UserRepository userRepo,
                                PasswordEncoder encoder,
                                Optional<JavaMailSender> mailSender) {
        this.tokenRepo = tokenRepo;
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.mailSender = mailSender;
    }

    /**
     * Initiates a password reset. Always returns successfully — never reveals
     * whether the email is registered.
     */
    public void initiatePasswordReset(String email) {
        Optional<User> userOpt = userRepo.findByEmail(email.trim());
        if (userOpt.isEmpty()) {
            log.debug("Password reset requested for unregistered email");
            return;
        }

        User user = userOpt.get();

        // Invalidate any existing tokens for this user
        tokenRepo.deleteByUserId(user.getId());

        // Generate a cryptographically secure random token (256-bit)
        byte[] tokenBytes = new byte[32];
        RANDOM.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String tokenHash = sha256Hex(rawToken);

        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setTokenHash(tokenHash);
        prt.setExpiresAt(Instant.now().plus(TOKEN_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        tokenRepo.save(prt);

        String resetUrl = frontendUrl + "/reset-password?token=" + rawToken;
        sendResetEmail(user, resetUrl);
    }

    /**
     * Validates the reset token and updates the user's password.
     * The token is single-use — it is marked used after a successful reset.
     */
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = sha256Hex(rawToken);
        PasswordResetToken prt = tokenRepo
                .findByTokenHashAndUsedFalseAndExpiresAtAfter(tokenHash, Instant.now())
                .orElseThrow(() -> new InvalidTokenException(
                        "This reset link is invalid or has expired. Please request a new one."));

        User user = prt.getUser();
        user.setPasswordHashed(encoder.encode(newPassword));
        userRepo.save(user);

        // Mark as used to prevent token reuse
        prt.setUsed(true);
        tokenRepo.save(prt);
    }

    private void sendResetEmail(User user, String resetUrl) {
        if (mailSender.isEmpty()) {
            log.info("Mail not configured — password reset URL for {}: {}", user.getEmail(), resetUrl);
            return;
        }
        try {
            MimeMessage message = mailSender.get().createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(user.getEmail());
            helper.setSubject("Reset your BlogHub password");
            helper.setText(buildEmailHtml(user.getName(), resetUrl), true);
            mailSender.get().send(message);
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (MessagingException | RuntimeException e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private String buildEmailHtml(String name, String resetUrl) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
                    <tr><td align="center">
                      <table width="520" cellpadding="0" cellspacing="0"
                             style="background:#ffffff;border-radius:16px;overflow:hidden;
                                    box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:520px;width:100%%;">
                        <tr>
                          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.4px;">
                              &#9998;&nbsp;&nbsp;BlogHub
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 40px 28px;">
                            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
                              Reset your password
                            </h1>
                            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                              Hi %s,<br/>
                              We received a request to reset your BlogHub password.
                              Click the button below to choose a new password.
                            </p>
                            <div style="text-align:center;margin:28px 0;">
                              <a href="%s"
                                 style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                                        color:#ffffff;text-decoration:none;padding:14px 36px;
                                        border-radius:10px;font-size:15px;font-weight:600;">
                                Reset Password
                              </a>
                            </div>
                            <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;">
                              Or copy and paste this link into your browser:
                            </p>
                            <p style="margin:0 0 24px;font-size:12px;color:#6366f1;word-break:break-all;">%s</p>
                            <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
                              <p style="margin:0;font-size:13px;color:#92400e;">
                                &#9203;&nbsp;This link expires in <strong>15 minutes</strong>.
                              </p>
                            </div>
                            <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;">
                              <p style="margin:0;font-size:13px;color:#991b1b;">
                                &#128274;&nbsp;If you didn't request this, you can safely ignore this email.
                                Your password won't change.
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top:1px solid #f1f5f9;padding:18px 40px;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;">
                              &copy; 2025 BlogHub. All rights reserved.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(name, resetUrl, resetUrl);
    }
}
