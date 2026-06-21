package com.example.blog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "site_settings")
@Getter
@Setter
public class SiteSettings {

    @Id
    @Column(name = "`key`", length = 100)
    private String key;

    @Column(columnDefinition = "TEXT")
    private String value;

    @Column(length = 255)
    private String description;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
