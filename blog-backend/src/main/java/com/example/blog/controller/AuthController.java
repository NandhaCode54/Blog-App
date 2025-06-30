package com.example.blog.controller;

import com.example.blog.dto.LoginRequest;
import com.example.blog.dto.LoginResponse;
import com.example.blog.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService users;

    public AuthController(UserService users) {
        this.users = users;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest req) {
        return users.loginOrRegister(req);
    }
}
