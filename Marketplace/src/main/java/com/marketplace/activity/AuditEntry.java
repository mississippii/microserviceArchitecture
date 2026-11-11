package com.marketplace.activity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/** Who did what to which record. Rows are only ever added. */
@Entity
@Table(name = "audit_log")
@Getter
@Setter
public class AuditEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long actorId;
    private String action;
    private String entity;
    private Long entityId;
    private String details;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
