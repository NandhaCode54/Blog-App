package com.example.blog.config;

import com.example.blog.entity.Role;
import com.example.blog.entity.User;
import com.example.blog.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Ensures at least one ADMIN account exists on startup. Configure via
 * ADMIN_EMAIL / ADMIN_PASSWORD env vars; disable with app.admin.seed-enabled=false.
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);
    private static final String DEFAULT_PASSWORD = "admin12345";

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final boolean enabled;
    private final String email;
    private final String name;
    private final String password;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder,
                       @Value("${app.admin.seed-enabled:true}") boolean enabled,
                       @Value("${app.admin.email:admin@blog.local}") String email,
                       @Value("${app.admin.name:Administrator}") String name,
                       @Value("${app.admin.password:" + DEFAULT_PASSWORD + "}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.enabled = enabled;
        this.email = email;
        this.name = name;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (!enabled || users.existsByRole(Role.ADMIN) || users.findByEmail(email).isPresent()) {
            return;
        }
        User admin = new User();
        admin.setEmail(email);
        admin.setName(name);
        admin.setPasswordHashed(encoder.encode(password));
        admin.setRole(Role.ADMIN);
        users.save(admin);

        log.info("Seeded initial ADMIN account: {}", email);
        if (DEFAULT_PASSWORD.equals(password)) {
            log.warn("ADMIN account is using the DEFAULT password. Set ADMIN_PASSWORD before deploying!");
        }
    }
}
