package com.marketplace.activity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String title;
    private String body;
    private String link;
    private OffsetDateTime readAt;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
