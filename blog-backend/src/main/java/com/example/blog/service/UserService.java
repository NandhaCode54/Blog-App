package com.example.blog.service;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.entity.User;
import com.example.blog.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;


@Service
@AllArgsConstructor
@Getter
@Setter
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;



    public LoginResponse loginOrRegister(LoginRequest req) {

        User user = repo.findByEmail(req.email()).orElse(null);

        if (user == null) {             // registration path
            user = new User();
            user.setEmail(req.email());
            user.setName(req.name());
            user.setPasswordHashed(encoder.encode(req.password()));
            user = repo.save(user);
        } else {                        // login path
            if (!encoder.matches(req.password(), user.getPasswordHashed())) {
                throw new RuntimeException("Invalid password");
            }
            // Optional: allow updating the name if it's currently null/blank
            if (user.getName() == null && req.name() != null) {
                user.setName(req.name());
                repo.save(user);
            }
        }


        String token = jwt.generateToken(user.getId(), user.getEmail());

        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                token
        );
    }
}
