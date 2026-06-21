package com.example.blog.service;

import com.example.blog.entity.SiteSettings;
import com.example.blog.exception.ResourceNotFoundException;
import com.example.blog.repository.SiteSettingsRepository;
import com.example.blog.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SiteSettingsService {

    private final SiteSettingsRepository repo;

    public SiteSettingsService(SiteSettingsRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public Map<String, String> getAll() {
        return repo.findAll().stream()
                .collect(Collectors.toMap(SiteSettings::getKey, s -> s.getValue() == null ? "" : s.getValue()));
    }

    @Transactional(readOnly = true)
    public String get(String key) {
        return repo.findById(key)
                .map(s -> s.getValue() == null ? "" : s.getValue())
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
    }

    @Transactional
    public Map<String, String> updateBulk(Map<String, String> updates, UserPrincipal admin) {
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            SiteSettings s = repo.findById(entry.getKey())
                    .orElseGet(() -> {
                        SiteSettings ns = new SiteSettings();
                        ns.setKey(entry.getKey());
                        return ns;
                    });
            s.setValue(entry.getValue());
            s.setUpdatedBy(admin.id());
            s.setUpdatedAt(Instant.now());
            repo.save(s);
        }
        return getAll();
    }
}
