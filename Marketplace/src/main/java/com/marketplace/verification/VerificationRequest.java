package com.marketplace.verification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "verification_requests")
@Getter
@Setter
public class VerificationRequest {

    public enum Status { PENDING, APPROVED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private String documentUrl;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private Long reviewerId;
    private String note;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
