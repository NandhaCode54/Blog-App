package com.example.blog.controller;

import com.example.blog.entity.Notification;
import com.example.blog.security.UserPrincipal;
import com.example.blog.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications", description = "In-app notification inbox")
public class NotificationController {

    private final NotificationService svc;

    public NotificationController(NotificationService svc) {
        this.svc = svc;
    }

    @Operation(summary = "Get my notifications (newest first, max 50)")
    @GetMapping
    public List<Notification> list(@AuthenticationPrincipal UserPrincipal me) {
        return svc.listForUser(me.id());
    }

    @Operation(summary = "Get unread count")
    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal UserPrincipal me) {
        return Map.of("count", svc.unreadCount(me.id()));
    }

    @Operation(summary = "Mark a single notification as read")
    @PutMapping("/{id}/read")
    public Notification markRead(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal me) {
        return svc.markRead(id, me.id());
    }

    @Operation(summary = "Mark all notifications as read")
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal me) {
        svc.markAllRead(me.id());
        return ResponseEntity.noContent().build();
    }
}
