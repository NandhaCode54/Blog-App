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
import java.util.HexFormat;
import java.util.Optional;

@Service
@Transactional
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PasswordResetTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final Optional<JavaMailSender> mailSender;

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
     * Generates a 6-digit OTP for the given email and sends it.
     * Always returns successfully — never reveals whether the email is registered.
     */
    public void initiatePasswordReset(String email) {
        Optional<User> userOpt = userRepo.findByEmail(email.trim());
        if (userOpt.isEmpty()) {
            log.debug("OTP requested for unregistered email");
            return;
        }

        User user = userOpt.get();

        // Invalidate any existing OTP for this user
        tokenRepo.deleteByUserId(user.getId());

        // 6-digit OTP: 100000–999999
        String rawOtp = String.valueOf(100000 + RANDOM.nextInt(900000));
        String otpHash = sha256Hex(rawOtp);

        PasswordResetToken prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setOtpHash(otpHash);
        prt.setExpiresAt(Instant.now().plus(OTP_EXPIRY_MINUTES, ChronoUnit.MINUTES));
        tokenRepo.save(prt);

        sendOtpEmail(user, rawOtp);
    }

    /**
     * Verifies the OTP and resets the password.
     * Tracks failed attempts — locks out after MAX_ATTEMPTS.
     */
    public void resetPassword(String email, String rawOtp, String newPassword) {
        User user = userRepo.findByEmail(email.trim())
                .orElseThrow(() -> new InvalidTokenException("Incorrect code. Please check and try again."));

        PasswordResetToken prt = tokenRepo
                .findByUserIdAndUsedFalseAndExpiresAtAfter(user.getId(), Instant.now())
                .orElseThrow(() -> new InvalidTokenException(
                        "Your code has expired. Please request a new one."));

        if (prt.getAttempts() >= MAX_ATTEMPTS) {
            prt.setUsed(true);
            tokenRepo.save(prt);
            throw new InvalidTokenException(
                    "Too many incorrect attempts. Please request a new code.");
        }

        if (!sha256Hex(rawOtp).equals(prt.getOtpHash())) {
            int newAttempts = prt.getAttempts() + 1;
            prt.setAttempts(newAttempts);
            if (newAttempts >= MAX_ATTEMPTS) {
                prt.setUsed(true);
            }
            tokenRepo.save(prt);

            int remaining = MAX_ATTEMPTS - newAttempts;
            String msg = remaining > 0
                    ? "Incorrect code. " + remaining + " attempt" + (remaining == 1 ? "" : "s") + " remaining."
                    : "Too many incorrect attempts. Please request a new code.";
            throw new InvalidTokenException(msg);
        }

        user.setPasswordHashed(encoder.encode(newPassword));
        userRepo.save(user);

        prt.setUsed(true);
        tokenRepo.save(prt);
    }

    private void sendOtpEmail(User user, String rawOtp) {
        if (mailSender.isEmpty()) {
            log.info("Mail not configured — OTP for {}: {}", user.getEmail(), rawOtp);
            return;
        }
        try {
            MimeMessage message = mailSender.get().createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(user.getEmail());
            helper.setSubject("Your BlogHub verification code");
            helper.setText(buildOtpEmailHtml(user.getName(), rawOtp), true);
            mailSender.get().send(message);
            log.info("OTP email sent to {}", user.getEmail());
        } catch (MessagingException | RuntimeException e) {
            log.error("Failed to send OTP email to {}: {}", user.getEmail(), e.getMessage());
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

    private String buildOtpEmailHtml(String name, String otp) {
        // Split OTP into individual digits for display
        String digits = String.join("</td><td style=\"width:44px;height:52px;text-align:center;"
                + "font-size:26px;font-weight:700;background:#f8fafc;border:2px solid #e2e8f0;"
                + "border-radius:10px;color:#0f172a;\">",
                otp.split(""));

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
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
                          <td style="padding:36px 40px 32px;">
                            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">
                              Your verification code
                            </h1>
                            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                              Hi %s,<br/>Use the code below to reset your BlogHub password.
                            </p>
                            <table cellpadding="0" cellspacing="6" style="margin:0 auto 28px;">
                              <tr>
                                <td style="width:44px;height:52px;text-align:center;font-size:26px;
                                           font-weight:700;background:#f8fafc;border:2px solid #e2e8f0;
                                           border-radius:10px;color:#0f172a;">%s</td>
                              </tr>
                            </table>
                            <div style="background:#fef3c7;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
                              <p style="margin:0;font-size:13px;color:#92400e;">
                                &#9203;&nbsp;This code expires in <strong>10 minutes</strong>.
                                You have <strong>5 attempts</strong> before it is locked.
                              </p>
                            </div>
                            <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;">
                              <p style="margin:0;font-size:13px;color:#991b1b;">
                                &#128274;&nbsp;If you didn't request this, you can safely ignore this email.
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="border-top:1px solid #f1f5f9;padding:18px 40px;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; 2025 BlogHub. All rights reserved.</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(name, digits);
    }
}
