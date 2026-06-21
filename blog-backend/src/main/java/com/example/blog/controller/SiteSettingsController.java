package com.example.blog.controller;

import com.example.blog.security.UserPrincipal;
import com.example.blog.service.SiteSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@Tag(name = "Site Settings", description = "Blog-wide configuration")
public class SiteSettingsController {

    private final SiteSettingsService settings;

    public SiteSettingsController(SiteSettingsService settings) {
        this.settings = settings;
    }

    @Operation(summary = "Get all public site settings")
    @GetMapping("/settings")
    public Map<String, String> getAll() {
        return settings.getAll();
    }

    @Operation(summary = "Update site settings (admin only)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/settings")
    public Map<String, String> updateBulk(
            @RequestBody Map<String, String> updates,
            @AuthenticationPrincipal UserPrincipal admin) {
        return settings.updateBulk(updates, admin);
    }
}
