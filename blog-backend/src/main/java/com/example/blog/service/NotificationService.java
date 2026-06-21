package com.example.blog.service;

import com.example.blog.entity.Notification;
import com.example.blog.exception.ForbiddenException;
import com.example.blog.exception.ResourceNotFoundException;
import com.example.blog.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    /** Create and persist an in-app notification. */
    @Transactional
    public Notification create(Long userId, String type, String title, String body, String link) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setLink(link);
        return repo.save(n);
    }

    @Transactional(readOnly = true)
    public List<Notification> listForUser(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repo.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public Notification markRead(Long id, Long userId) {
        Notification n = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!n.getUserId().equals(userId)) throw new ForbiddenException("Not your notification");
        n.setRead(true);
        return repo.save(n);
    }

    @Transactional
    public void markAllRead(Long userId) {
        repo.markAllReadForUser(userId);
    }
}
